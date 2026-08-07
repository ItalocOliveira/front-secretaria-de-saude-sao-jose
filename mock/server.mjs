/**
 * API mockada da Secretária de Saúde de São José dos Ramos.
 *
 * O json-server cuida da camada de dados (listagem, filtros, ordenação,
 * paginação, busca por id, PATCH/PUT/DELETE e persistência em db.json). Este
 * arquivo coloca na frente dele o que o json-server não sabe fazer: JWT,
 * controle de acesso por role e as validações documentadas em
 * `.docs/api-backend.md`.
 *
 * IMPORTANTE: só para desenvolvimento. O "hash" e a "criptografia" aqui são
 * fachadas reversíveis e o segredo do JWT está no código.
 */
import { copyFileSync, createReadStream, existsSync, mkdirSync, rmSync } from "node:fs"
import { writeFile } from "node:fs/promises"
import { createServer } from "node:http"
import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { parseArgs } from "node:util"

import { Low } from "lowdb"
import { JSONFile } from "lowdb/node"

// O json-server 1.x é CLI-first: não declara `main` nem `exports`, então o app
// interno é importado direto de `lib/`. Por isso a versão está pinada (sem `^`)
// no package.json — um bump de beta pode mover esse caminho.
import { createApp } from "json-server/lib/app.js"

const HERE = dirname(fileURLToPath(import.meta.url))
const SEED_FILE = join(HERE, "db.seed.json")
const DB_FILE = join(HERE, "db.json")
const UPLOADS_DIR = join(HERE, "uploads")

const JWT_SECRET = "mock-secret-nao-usar-em-producao"
const TOKEN_TTL_SECONDS = 60 * 60 // 1 hora, como na API real
const UPLOAD_TTL_MS = 15 * 60 * 1000 // validade da presigned URL de upload, como na API real
const DOWNLOAD_TTL_MS = 60 * 60 * 1000 // validade da presigned URL de download, como na API real

const ROLES = ["DEV", "SECRETARIA", "DIRETOR", "RECEPCIONISTA", "REGULADOR"]
// Espelha `APAC_PROCEDURE_LIST` em `src/lib/apac.ts` — chave do enum Prisma
// (SCREAMING_SNAKE_CASE, sem acento), não o texto formatado. Mantenha as duas
// listas em sincronia.
const PROCEDURES = [
  "CONSULTA_EM_ALERGIA_E_IMUNOLOGIA_PEDIATRICA",
  "CONSULTA_EM_ODONTOLOGIA_CIRURGIA_BUCO_MAXILO_FACIAL",
  "CONSULTA_EM_CIRURGIA_DE_CABECA_E_PESCOCO",
  "OCI_AVALIACAO_CARDIOLOGICA",
  "CONSULTA_EM_DERMATOLOGIA_ADULTO",
  "CONSULTA_EM_ENDOCRINOLOGIA_E_METABOLOGIA",
  "CONSULTA_EM_GASTROENTEROLOGIA_GERAL",
  "CONSULTA_EM_GINECOLOGIA",
  "CONSULTA_EM_HEMATOLOGIA",
  "CONSULTA_EM_HEPATOLOGIA",
  "CONSULTA_EM_INFECTOLOGIA",
  "CONSULTA_EM_MASTOLOGIA_GERAL",
  "CONSULTA_EM_MASTOLOGIA_CIRURGIA",
  "CONSULTA_EM_NEFROLOGIA_PRE_DIALITICO",
  "CONSULTA_EM_NEUROCIRURGIA_ADULTO",
  "CONSULTA_EM_NEUROLOGIA_CLINICA",
  "CONSULTA_EM_PRE_NATAL_DE_ALTO_RISCO",
  "OCI_AVALIACAO_INICIAL_EM_OFTALMOLOGIA_A_PARTIR_DE_9_ANOS",
  "CONSULTA_EM_ONCOLOGIA_CLINICA",
  "OCI_AVALIACAO_DIAGNOSTICA_EM_ORTOPEDIA_COM_RECURSOS_DE_RADIOLOGIA",
  "CONSULTA_EM_OTORRINOLARINGOLOGIA",
  "OCI_AVALIACAO_INICIAL_DIAGNOSTICA_DE_DEFICIT_AUDITIVO",
  "OCI_AVALIACAO_DIAGNOSTICA_DE_NASORAFINGE_E_DE_OROFARINGE",
  "CONSULTA_EM_CIRURGIA_PLASTICA",
  "CONSULTA_EM_PNEUMOLOGIA",
  "CONSULTA_EM_PROCTOLOGIA",
  "CONSULTA_EM_PSIQUIATRIA",
  "CONSULTA_EM_REUMATOLOGIA",
  "CONSULTA_EM_UROLOGIA",
  "CONSULTA_EM_PEDIATRIA",
  "CONSULTA_EM_CARDIOLOGIA_PEDIATRIA",
  "CONSULTA_EM_DERMATOLOGIA_PEDIATRIA",
  "CONSULTA_EM_ENDOCRINOLOGIA_E_METABOLOGIA_PEDIATRIA",
  "CONSULTA_EM_GASTROENTEROLOGIA_PEDIATRIA",
  "CONSULTA_EM_GINECOLOGIA_PEDIATRIA",
  "CONSULTA_EM_HEMATOLOGIA_PEDIATRIA",
  "CONSULTA_EM_HEPATOLOGIA_PEDIATRIA",
  "CONSULTA_EM_NEFROLOGIA_PEDIATRIA",
  "CONSULTA_EM_NEUROCIRURGIA_PEDIATRIA",
  "CONSULTA_EM_NEUROLOGIA_PEDIATRIA",
  "OCI_AVALIACAO_INICIAL_EM_OFTALMOLOGIA_0_A_8_ANOS",
  "CONSULTA_EM_ORTOPEDIA_GERAL_PEDIATRIA",
  "CONSULTA_EM_OTORRINOLARINGOLOGIA_PEDIATRICA",
  "CONSULTA_EM_PNEUMOLOGIA_PEDIATRIA",
  "CONSULTA_EM_PSIQUIATRIA_PEDIATRIA",
  "CONSULTA_EM_CARDIOLOGIA_CARDIOPATIA_CONGENITA",
  "CONSULTA_EM_CIRURGIA_PEDIATRICA",
]
const PRIORITIES = ["URGENTE", "ELETIVO"]
// Espelha `ITEM_TYPE`/`MOVEMENT_TYPE` em `src/lib/itens.ts`.
const ITEM_TYPES = ["EQUIPAMENTO", "MEDICAMENTO"]
const MOVEMENT_TYPES = ["ENTRADA", "SAIDA"]
const ACS_LIST = [
  "MARLON",
  "MARIA_JOSE_SILVA_RIBEIRO",
  "MARIA_JOSE_DE_ARAUJO",
  "MARIA_DE_LOURDES",
  "MANOEL_BATISTA",
  "LEYDIANE_ARAUJO",
  "KAIO_VICTOR",
  "JOAO_MANOEL",
  "ELANE_CRISTINA",
  "EDILEUZA_ALVES",
  "ANA_EMILIA",
  "DEYSE",
  "JOELMA_FERNANDES",
  "FLAVIO",
]

/** Roles com acesso a cada coleção, conforme a matriz de permissões da doc. */
const ACCESS = {
  users: ["DEV", "DIRETOR", "SECRETARIA"],
  apacs: ["DEV", "DIRETOR", "RECEPCIONISTA", "REGULADOR"],
  itens: ["DEV", "DIRETOR", "REGULADOR"],
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const { values: flags } = parseArgs({
  options: {
    port: { type: "string", short: "p", default: process.env.PORT ?? "3000" },
    host: { type: "string", short: "h", default: process.env.HOST ?? "localhost" },
    reset: { type: "boolean", default: false },
  },
})

const PORT = Number.parseInt(flags.port, 10)
const HOST = flags.host

// ---------------------------------------------------------------------------
// Banco
// ---------------------------------------------------------------------------

// db.json é descartável (gitignored) e recriado a partir do seed versionado.
if (flags.reset && existsSync(DB_FILE)) rmSync(DB_FILE)
if (!existsSync(DB_FILE)) copyFileSync(SEED_FILE, DB_FILE)

if (flags.reset && existsSync(UPLOADS_DIR)) rmSync(UPLOADS_DIR, { recursive: true })
mkdirSync(UPLOADS_DIR, { recursive: true })

const db = new Low(new JSONFile(DB_FILE), {})
await db.read()

db.data ??= {}
db.data.users ??= []
db.data.apacs ??= []
db.data.itens ??= []
db.data._credentials ??= []

const jsonServer = createApp(db, { logger: false })

// ---------------------------------------------------------------------------
// Fachadas de hash/criptografia
// ---------------------------------------------------------------------------

/** Imita `cpf_hash` / `cns_hash`. Determinístico, não é Argon2. */
const fakeHash = (value) => createHash("sha256").update(String(value)).digest("hex")

/** Imita `cpf_encrypted` / `cns_encrypted`. Reversível de propósito, para debug. */
const fakeEncrypt = (value) => `enc:${Buffer.from(String(value)).toString("base64url")}`

// ---------------------------------------------------------------------------
// JWT (HS256 de verdade, com segredo fixo)
// ---------------------------------------------------------------------------

const b64url = (value) => Buffer.from(value).toString("base64url")
const hmac = (data) => createHmac("sha256", JWT_SECRET).update(data).digest("base64url")

function signToken(payload) {
  const data = `${b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }))}.${b64url(JSON.stringify(payload))}`
  return `${data}.${hmac(data)}`
}

function verifyToken(token) {
  const [header, body, signature] = token.split(".")
  if (!header || !body || !signature) return null

  const expected = hmac(`${header}.${body}`)
  if (signature.length !== expected.length) return null
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null

  let payload
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"))
  } catch {
    return null
  }

  if (typeof payload?.exp !== "number" || payload.exp * 1000 <= Date.now()) return null

  return payload
}

// ---------------------------------------------------------------------------
// Respostas
// ---------------------------------------------------------------------------

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "access-control-max-age": "86400",
}

function send(res, status, payload) {
  res.writeHead(status, { ...CORS_HEADERS, "content-type": "application/json; charset=utf-8" })
  res.end(JSON.stringify(payload, null, 2))
}

/** `{ status, body }` — formato usado pelos guards abaixo. */
const sendError = (res, error) => send(res, error.status, error.body)

const unauthorized = (message) => ({ status: 401, body: { message } })
const forbidden = () => ({ status: 403, body: { message: "Acesso negado. Privilégios insuficientes." } })

// ---------------------------------------------------------------------------
// Autenticação e autorização
// ---------------------------------------------------------------------------

function authenticate(req) {
  const header = req.headers.authorization
  if (!header) return { error: unauthorized("Token de autorização não fornecido.") }

  const parts = header.split(" ")
  if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1]) {
    return { error: unauthorized("Token mal formatado.") }
  }

  const payload = verifyToken(parts[1])
  if (!payload) return { error: unauthorized("Token inválido ou expirado.") }

  return { user: { id: payload.id, cpf: payload.cpf, role: payload.role } }
}

function authorize(user, roles) {
  return roles.includes(user.role) ? {} : { error: forbidden() }
}

// ---------------------------------------------------------------------------
// Corpo da requisição
// ---------------------------------------------------------------------------

/**
 * Lê e parseia o corpo. Retorna `null` se o JSON for inválido ou não for um
 * objeto. Só pode ser usado em rotas que NÃO são delegadas ao json-server: o
 * parser dele (milliparsec) espera pelo evento `end` do stream e travaria a
 * requisição se o corpo já tivesse sido consumido aqui.
 */
async function readJsonBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  if (chunks.length === 0) return {}

  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"))
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// /auth
// ---------------------------------------------------------------------------

async function login(req, res) {
  const body = await readJsonBody(req)
  const invalid = () => send(res, 401, { message: "Credenciais inválidas." })

  if (!body?.cpf || !body?.password) return invalid()

  const credential = db.data._credentials.find(
    (item) => item.cpf === String(body.cpf) && item.password === String(body.password)
  )
  if (!credential) return invalid()

  const user = db.data.users.find((item) => item.id === credential.user_id)
  if (!user) return invalid()

  const iat = Math.floor(Date.now() / 1000)
  const token = signToken({
    id: user.id,
    cpf: user.cpf_hash,
    role: user.role,
    iat,
    exp: iat + TOKEN_TTL_SECONDS,
  })

  return send(res, 200, { token })
}

async function handleAuth(req, res, segments) {
  const [action] = segments

  if (action === "login" && segments.length === 1) {
    if (req.method !== "POST") return send(res, 404, { message: "Rota não encontrada." })
    return login(req, res)
  }

  // /auth/me e /auth/admin são autenticados
  const { user, error } = authenticate(req)
  if (error) return sendError(res, error)

  if (action === "me" && segments.length === 1 && req.method === "GET") {
    return send(res, 200, user)
  }

  if (action === "admin" && segments.length === 1 && req.method === "GET") {
    const denied = authorize(user, ["DEV", "DIRETOR"]).error
    if (denied) return sendError(res, denied)

    return send(res, 200, {
      message: "Bem-vindo à área SUPREMA, apenas pessoal autorizado pode obter esta mensagem",
      user,
    })
  }

  return send(res, 404, { message: "Rota não encontrada." })
}

// ---------------------------------------------------------------------------
// POST /users
// ---------------------------------------------------------------------------

async function createUser(req, res) {
  const body = await readJsonBody(req)
  if (!body) return send(res, 400, { message: "Corpo da requisição deve ser um objeto JSON." })

  const missing = ["name", "cpf", "password", "role"].filter((field) => !body[field])
  if (missing.length > 0) {
    return send(res, 400, { message: `Campos obrigatórios ausentes: ${missing.join(", ")}.` })
  }

  if (!ROLES.includes(body.role)) {
    return send(res, 400, { message: `Role inválida. Valores aceitos: ${ROLES.join(", ")}.` })
  }

  const cpf = String(body.cpf)
  if (db.data._credentials.some((item) => item.cpf === cpf)) {
    return send(res, 409, { message: "CPF já cadastrado." })
  }

  const now = new Date().toISOString()
  const user = {
    id: randomUUID(),
    name: String(body.name),
    cpf_hash: fakeHash(cpf),
    cpf_encrypted: fakeEncrypt(cpf),
    role: body.role,
    created_at: now,
    updated_at: now,
  }

  // A senha fica fora de `users` para não vazar no GET /users, que é servido
  // direto pelo json-server a partir do db.json.
  db.data.users.push(user)
  db.data._credentials.push({
    user_id: user.id,
    cpf,
    password: String(body.password),
    password_hash: fakeHash(body.password),
  })
  await db.write()

  // A doc documenta 200 (não 201) para este endpoint.
  return send(res, 200, user)
}

// ---------------------------------------------------------------------------
// POST /apacs
// ---------------------------------------------------------------------------

async function createApac(req, res) {
  const fail = (details) => send(res, 500, { error: "Erro ao criar Apac", details })

  const body = await readJsonBody(req)
  if (!body) return fail({ message: "Corpo da requisição deve ser um objeto JSON." })

  const details = {}
  if (!body.name) details.name = "Campo obrigatório."
  if (!body.cns) details.cns = "Campo obrigatório."
  if (!PROCEDURES.includes(body.procedure)) details.procedure = `Valores aceitos: ${PROCEDURES.join(", ")}.`
  if (!PRIORITIES.includes(body.priority)) details.priority = `Valores aceitos: ${PRIORITIES.join(", ")}.`
  if (!ACS_LIST.includes(body.acs)) details.acs = `Valores aceitos: ${ACS_LIST.join(", ")}.`
  if (body.birth_date != null && Number.isNaN(Date.parse(body.birth_date))) {
    details.birth_date = "Data inválida — use ISO 8601."
  }
  if (Object.keys(details).length > 0) return fail(details)

  const now = new Date().toISOString()
  const apac = {
    id: randomUUID(),
    name: String(body.name),
    birth_date: body.birth_date ? new Date(body.birth_date).toISOString() : null,
    cns: fakeEncrypt(body.cns),
    cpf: body.cpf ? fakeEncrypt(body.cpf) : null,
    status: "PENDENTE", // `status` nunca vem do cliente
    municipality: body.municipality ? String(body.municipality) : null,
    procedure: body.procedure,
    priority: body.priority,
    acs: body.acs,
    created_at: now,
    updated_at: now,
  }

  db.data.apacs.push(apac)
  await db.write()

  // Espelha a API real: o backend não recebe o PDF, só devolve uma presigned
  // URL pro cliente fazer o PUT direto no bucket (aqui, num endpoint local que
  // imita o R2, `exp` incluso).
  const uploadUrl = mockPdfUrl(apac.id, UPLOAD_TTL_MS)

  return send(res, 201, { apac, uploadUrl })
}

// ---------------------------------------------------------------------------
// POST /itens
// ---------------------------------------------------------------------------

async function createItem(req, res, user) {
  const fail = (details) => send(res, 500, { error: "Erro ao criar item", details })

  const body = await readJsonBody(req)
  if (!body) return fail({ message: "Corpo da requisição deve ser um objeto JSON." })

  const details = {}
  if (!body.name) details.name = "Campo obrigatório."
  if (!ITEM_TYPES.includes(body.type)) details.type = `Valores aceitos: ${ITEM_TYPES.join(", ")}.`
  if (body.amount != null && (!Number.isFinite(Number(body.amount)) || Number(body.amount) < 0)) {
    details.amount = "Deve ser um número não negativo."
  }
  if (Object.keys(details).length > 0) return fail(details)

  const amount = body.amount != null ? Number(body.amount) : 0
  const name = String(body.name)

  const item = {
    id: randomUUID(),
    name,
    status: "DISPONIVEL", // definido no backend, não vem do cliente
    amount,
    type: body.type,
    ...(body.description ? { description: String(body.description) } : {}),
    // `amount: 0` representa "produto sem estoque ainda" — sem movimento no histórico.
    movements:
      amount > 0
        ? [
            {
              id: randomUUID(),
              itemId: "", // preenchido abaixo, depois que o id do item existe
              userId: user.id,
              movementType: "ENTRADA",
              amount,
              description: `Item ${name} foi criado no estoque com ${amount} unidades.`,
              dateTime: new Date().toISOString(),
            },
          ]
        : [],
  }
  if (item.movements[0]) item.movements[0].itemId = item.id

  db.data.itens.push(item)
  await db.write()

  return send(res, 201, item)
}

// ---------------------------------------------------------------------------
// POST /itens/:id/movements
// ---------------------------------------------------------------------------

async function createItemMovement(req, res, itemId, user) {
  const body = await readJsonBody(req)
  if (!body) return send(res, 500, { message: "Corpo da requisição deve ser um objeto JSON." })

  if (!MOVEMENT_TYPES.includes(body.movementType)) {
    return send(res, 500, { message: `movementType inválido. Valores aceitos: ${MOVEMENT_TYPES.join(", ")}.` })
  }

  const amount = Number(body.amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    return send(res, 500, { message: "amount deve ser um número maior que zero." })
  }

  const item = db.data.itens.find((entry) => entry.id === itemId)
  if (!item) return send(res, 500, { message: "Item não encontrado." })

  if (body.movementType === "SAIDA" && amount > item.amount) {
    return send(res, 500, { message: "Estoque insuficiente para esta saída." })
  }

  item.amount = body.movementType === "ENTRADA" ? item.amount + amount : item.amount - amount

  const description =
    body.movementType === "ENTRADA"
      ? `Foram adicionadas ${amount} unidades de ${item.name} ao estoque.`
      : `Saída de ${amount} unidades de ${item.name}.`

  item.movements ??= []
  item.movements.unshift({
    id: randomUUID(),
    itemId: item.id,
    userId: user.id,
    movementType: body.movementType,
    amount,
    description,
    dateTime: new Date().toISOString(),
  })

  await db.write()

  return send(res, 201, item)
}

// ---------------------------------------------------------------------------
// /mock-uploads/:id.pdf — imita as presigned URLs (PUT de upload, GET de
// download) que a API real gera a partir do Cloudflare R2.
// ---------------------------------------------------------------------------

function mockPdfUrl(id, ttlMs) {
  return `http://${HOST}:${PORT}/mock-uploads/${id}.pdf?exp=${Date.now() + ttlMs}`
}

/** Injeta `pdf_url` em cada item de uma listagem/objeto de APAC, como a API real faz. */
function withPdfUrl(apac) {
  return apac?.id ? { ...apac, pdf_url: mockPdfUrl(apac.id, DOWNLOAD_TTL_MS) } : apac
}

async function readRawBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return Buffer.concat(chunks)
}

async function uploadMockPdf(req, res, filename, searchParams) {
  const exp = Number(searchParams.get("exp"))
  if (!Number.isFinite(exp) || Date.now() > exp) {
    return send(res, 403, { message: "Link de upload expirado." })
  }

  const body = await readRawBody(req)
  await writeFile(join(UPLOADS_DIR, filename), body)

  return send(res, 200, { ok: true })
}

function downloadMockPdf(req, res, filename, searchParams) {
  const exp = Number(searchParams.get("exp"))
  if (!Number.isFinite(exp) || Date.now() > exp) {
    return send(res, 403, { message: "Link de download expirado." })
  }

  const filePath = join(UPLOADS_DIR, filename)
  if (!existsSync(filePath)) {
    return send(res, 404, { message: "Nenhum PDF enviado para esta APAC ainda." })
  }

  res.writeHead(200, { ...CORS_HEADERS, "content-type": "application/pdf" })
  createReadStream(filePath).pipe(res)
}

// ---------------------------------------------------------------------------
// Roteador
// ---------------------------------------------------------------------------

function preflight(req, res) {
  res.writeHead(204, {
    ...CORS_HEADERS,
    "access-control-allow-headers": req.headers["access-control-request-headers"] ?? "Content-Type,Authorization",
  })
  res.end()
}

function routeIndex() {
  return {
    api: "Mock — Secretária de Saúde de São José dos Ramos",
    endpoints: [
      { method: "POST", path: "/auth/login", roles: "público" },
      { method: "GET", path: "/auth/me", roles: "qualquer role autenticada" },
      { method: "GET", path: "/auth/admin", roles: "DEV, DIRETOR" },
      { method: "POST", path: "/users", roles: ACCESS.users.join(", ") },
      { method: "GET", path: "/users", roles: ACCESS.users.join(", ") },
      { method: "GET", path: "/users/:id", roles: `${ACCESS.users.join(", ")} (extra do mock)` },
      { method: "POST", path: "/apacs", roles: ACCESS.apacs.join(", ") },
      { method: "GET", path: "/apacs", roles: ACCESS.apacs.join(", ") },
      { method: "GET", path: "/apacs/:id", roles: `${ACCESS.apacs.join(", ")} (extra do mock)` },
      { method: "PATCH | PUT | DELETE", path: "/apacs/:id", roles: `${ACCESS.apacs.join(", ")} (extra do mock)` },
      { method: "POST", path: "/itens", roles: ACCESS.itens.join(", ") },
      { method: "GET", path: "/itens", roles: ACCESS.itens.join(", ") },
      { method: "PATCH | DELETE", path: "/itens/:id", roles: ACCESS.itens.join(", ") },
      { method: "POST", path: "/itens/:id/movements", roles: ACCESS.itens.join(", ") },
      {
        method: "PUT",
        path: "/mock-uploads/:id.pdf?exp=...",
        roles: "nenhuma (imita a presigned URL de upload do R2 devolvida por POST /apacs)",
      },
      {
        method: "GET",
        path: "/mock-uploads/:id.pdf?exp=...",
        roles: "nenhuma (imita a presigned URL de download do R2 devolvida em pdf_url por GET /apacs)",
      },
    ],
  }
}

const server = createServer(async (req, res) => {
  const method = req.method ?? "GET"
  const { pathname } = new URL(req.url ?? "/", `http://${HOST}:${PORT}`)

  res.on("finish", () => {
    console.log(`${method.padEnd(6)} ${res.statusCode}  ${pathname}`)
  })

  if (method === "OPTIONS") return preflight(req, res)

  const segments = pathname.split("/").filter(Boolean)
  if (segments.length === 0) return send(res, 200, routeIndex())

  const [collection, ...rest] = segments

  // Imita o R2: URL própria, sem role nem `Authorization` — só o `exp` na query.
  if (collection === "mock-uploads" && rest.length === 1) {
    const searchParams = new URL(req.url ?? "/", `http://${HOST}:${PORT}`).searchParams
    if (method === "PUT") return uploadMockPdf(req, res, rest[0], searchParams)
    if (method === "GET") return downloadMockPdf(req, res, rest[0], searchParams)
  }

  if (collection === "auth") return handleAuth(req, res, rest)

  // `/itens/:id/movements` é a única rota aninhada — todo o resto continua limitado a `/:collection[/:id]`.
  const isItemMovementsRoute = collection === "itens" && rest.length === 2 && rest[1] === "movements"

  // Whitelist: o json-server exporia qualquer chave do db.json como endpoint,
  // inclusive `_credentials`.
  const roles = ACCESS[collection]
  if (!roles || (rest.length > 1 && !isItemMovementsRoute)) return send(res, 404, { message: "Rota não encontrada." })

  const { user, error } = authenticate(req)
  if (error) return sendError(res, error)

  const denied = authorize(user, roles).error
  if (denied) return sendError(res, denied)

  if (method === "POST" && isItemMovementsRoute) {
    return createItemMovement(req, res, rest[0], user)
  }

  if (method === "POST" && rest.length === 0) {
    if (collection === "users") return createUser(req, res)
    if (collection === "apacs") return createApac(req, res)
    if (collection === "itens") return createItem(req, res, user)
  }

  // `pdf_url` é gerado sob demanda a cada GET, como na API real — o json-server só
  // serve o que está persistido em db.json, então essas duas rotas (sem query
  // params) respondem aqui, direto do banco em memória, com o campo injetado.
  // Com filtro/ordenação/paginação (`?status=...`, `?_sort=...`), cai no
  // json-server abaixo e não vem `pdf_url` — só para desenvolvimento.
  if (method === "GET" && collection === "apacs") {
    const searchParams = new URL(req.url ?? "/", `http://${HOST}:${PORT}`).searchParams
    if (rest.length === 0 && searchParams.size === 0) {
      return send(res, 200, db.data.apacs.map(withPdfUrl))
    }
    if (rest.length === 1 && searchParams.size === 0) {
      const found = db.data.apacs.find((item) => item.id === rest[0])
      if (!found) return send(res, 404, { message: "APAC não encontrada." })
      return send(res, 200, withPdfUrl(found))
    }
  }

  // Listagem, busca por id e mutações vão para o json-server. O corpo da
  // requisição chega intacto — nada acima leu o stream.
  return jsonServer.attach(req, res)
})

server.listen(PORT, HOST, () => {
  const base = `http://${HOST}:${PORT}`

  console.log(`\n  API mockada em ${base}`)
  console.log(`  Banco: mock/db.json (recrie com "pnpm api:mock --reset")\n`)
  console.log("  Credenciais:")

  for (const credential of db.data._credentials) {
    const user = db.data.users.find((item) => item.id === credential.user_id)
    console.log(`    ${(user?.role ?? "?").padEnd(14)} cpf ${credential.cpf}  senha ${credential.password}`)
  }

  console.log(`\n  Rotas em ${base}/\n`)
})
