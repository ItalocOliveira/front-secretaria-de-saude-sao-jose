/**
 * API mockada da Secretária de Saúde de São José dos Ramos.
 *
 * O json-server cuida da persistência em db.json e de PATCH/PUT/DELETE por id. Este
 * arquivo coloca na frente dele o que o json-server não sabe fazer: JWT, controle de
 * acesso por role, as listagens paginadas (`{ data, pagination }`, ver
 * `.docs/temp/MUDANCAS_CONTRATO_SEGURANCA.md`) e as validações documentadas em
 * `.docs/api-backend.md`.
 *
 * IMPORTANTE: só para desenvolvimento. O "hash" e a "criptografia" aqui são
 * fachadas reversíveis e o segredo do JWT está no código.
 */
import { copyFileSync, createReadStream, existsSync, mkdirSync, rmSync } from "node:fs"
import { readFile, writeFile } from "node:fs/promises"
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

const ROLES = ["DEV", "SECRETARIO", "DIRETOR", "RECEPCIONISTA", "REGULADOR", "COORDENADOR"]
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
  "EXAMES_OFTALMOLOGICOS_EM_GERAL",
  "RAIO_X",
  "ULTRASSOM",
  "ELETROCARDIOGRAMA",
  "MAMOGRAFIA",
]
const PRIORITIES = ["URGENTE", "ELETIVO"]
// Espelha `ITEM_TYPE`/`MOVEMENT_TYPE` em `src/lib/itens.ts`.
const ITEM_TYPES = [
  "MEDICAMENTO",
  "ODONTOLOGICO",
  "LABORATORIAL",
  "EXPEDIENTE",
  "INSUMO",
  "CONSUMO_GERAL",
  "MATERIAL_DE_LIMPEZA",
  "EQUIPAMENTO",
]
const MOVEMENT_TYPES = ["ENTRADA", "SAIDA"]
// Espelha `DOCUMENT_DESTINATION_LIST`/`DOCUMENT_STATUS_LIST` em `src/lib/document.ts`.
const DOCUMENT_DESTINATIONS = [
  "COMPRAS",
  "EDUCACAO",
  "FINANCAS",
  "RH",
  "CAMARA_DOS_VEREADORES",
  "PROMOTORIA",
  "OUTRO",
]
const DOCUMENT_STATUSES = ["ATENDIDO", "SOLICITADO", "NEGADO", "FINALIZADO"]
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

/** Roles com acesso a cada coleção, conforme `.docs/temp/PERMISSOES.md`. */
const ALL_ROLES = ["DEV", "DIRETOR", "SECRETARIO", "REGULADOR", "COORDENADOR", "RECEPCIONISTA"]
// RECEPCIONISTA é o único cargo com acesso parcial: só POST /documents, POST/GET /apacs,
// PATCH /apacs/:id e POST /reports/apacs. Os demais acessam todos os endpoints.
const ALL_EXCEPT_RECEPCIONISTA = ALL_ROLES.filter((role) => role !== "RECEPCIONISTA")

/** Roles por coleção — a mais ampla entre as rotas dela. O recorte por método fica em `rolesFor`. */
const ACCESS = {
  users: ALL_EXCEPT_RECEPCIONISTA,
  apacs: ALL_ROLES,
  itens: ALL_EXCEPT_RECEPCIONISTA,
  documents: ALL_ROLES,
  reports: ALL_ROLES,
}

/** Roles da rota específica: `DELETE /apacs/:id` e tudo de `/documents` além do `POST` são restritos. */
function rolesFor(collection, method, rest) {
  if (collection === "apacs" && method === "DELETE") return ALL_EXCEPT_RECEPCIONISTA
  if (collection === "documents" && !(method === "POST" && rest.length === 0)) return ALL_EXCEPT_RECEPCIONISTA
  return ACCESS[collection]
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
db.data.documents ??= []
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
    const denied = authorize(user, ALL_EXCEPT_RECEPCIONISTA).error
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

async function createUser(req, res, creator) {
  const body = await readJsonBody(req)
  if (!body) return send(res, 400, { message: "Corpo da requisição deve ser um objeto JSON." })

  const missing = ["name", "cpf", "password", "role"].filter((field) => !body[field])
  if (missing.length > 0) {
    return send(res, 400, { message: `Campos obrigatórios ausentes: ${missing.join(", ")}.` })
  }

  if (!ROLES.includes(body.role)) {
    return send(res, 400, { message: `Role inválida. Valores aceitos: ${ROLES.join(", ")}.` })
  }

  // Só `DEV` cria `DEV`, como na API real.
  if (body.role === "DEV" && creator.role !== "DEV") {
    return send(res, 403, { error: "Seu cargo não pode criar usuários com o cargo DEV." })
  }

  const cpf = String(body.cpf)
  if (db.data._credentials.some((item) => item.cpf === cpf)) {
    return send(res, 409, { error: "Já existe um usuário com este CPF." })
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
  // Como a API real: o 500 não expõe detalhe nenhum (o motivo só aparece no log do servidor).
  const fail = (details) => {
    console.warn("POST /apacs inválido:", Object.keys(details).join(", "))
    return send(res, 500, { error: "Erro ao criar Apac" })
  }

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
    has_pdf: false, // só vira `true` no `POST /apacs/:id/pdf/confirm`
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
// POST /reports/apacs — espelha `.docs/temp/RELATORIO_APACS.md`
// ---------------------------------------------------------------------------

// Brasília/Fortaleza não tem horário de verão: offset fixo de -3h.
const BRT_OFFSET_MS = 3 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

/** "YYYY-MM-DD" do instante no fuso de Brasília. */
function brtDay(ms) {
  return new Date(ms - BRT_OFFSET_MS).toISOString().slice(0, 10)
}

function countBy(list, key) {
  const result = {}
  for (const item of list) {
    const value = key(item)
    // Registros antigos do seed não têm todos os campos (ex.: `acs`).
    if (value == null) continue
    result[value] = (result[value] ?? 0) + 1
  }
  return result
}

function createdMs(apac) {
  return Date.parse(apac.created_at ?? apac.createdAt)
}

async function reportApacs(req, res) {
  const body = (await readJsonBody(req)) ?? {}
  const interval = body.interval ?? "day"
  if (interval !== "day" && interval !== "week") {
    return send(res, 400, { error: 'Valor inválido para "interval". Use um destes: day, week.' })
  }

  let start
  let end
  let prevStart
  let prevEnd

  if (body.startDate && body.endDate) {
    start = Date.parse(body.startDate)
    end = Date.parse(body.endDate)
    if (Number.isNaN(start) || Number.isNaN(end)) {
      return send(res, 400, { error: 'Datas inválidas. Envie "startDate" e "endDate" no formato ISO 8601.' })
    }
    const duration = end - start + 1
    prevEnd = start - 1
    prevStart = start - duration
  } else {
    const local = new Date(Date.now() - BRT_OFFSET_MS)
    const year = local.getUTCFullYear()
    const month = local.getUTCMonth()
    start = Date.UTC(year, month, 1) + BRT_OFFSET_MS
    end = Date.UTC(year, month + 1, 1) + BRT_OFFSET_MS - 1
    prevStart = Date.UTC(year, month - 1, 1) + BRT_OFFSET_MS
    prevEnd = start - 1
  }

  const apacs = db.data.apacs
  const inRange = (from, to) => apacs.filter((apac) => createdMs(apac) >= from && createdMs(apac) <= to)
  const inPeriod = inRange(start, end)
  const total = inPeriod.length
  const previousTotal = inRange(prevStart, prevEnd).length
  const difference = total - previousTotal

  const queue = apacs.filter((apac) => apac.status === "PENDENTE" || apac.status === "AGUARDO")
  const byPriority = Object.fromEntries(PRIORITIES.map((priority) => [priority, 0]))
  for (const apac of queue) byPriority[apac.priority] = (byPriority[apac.priority] ?? 0) + 1

  const perDay = countBy(inPeriod, (apac) => brtDay(createdMs(apac)))
  const points = []
  if (start <= end) {
    let cursor = Date.parse(`${brtDay(start)}T00:00:00Z`)
    const last = Date.parse(`${brtDay(end)}T00:00:00Z`)
    if (interval === "week") {
      // Recua até a segunda-feira (getUTCDay: 0 = domingo).
      cursor -= ((new Date(cursor).getUTCDay() + 6) % 7) * DAY_MS
    }
    const step = interval === "week" ? 7 * DAY_MS : DAY_MS
    for (; cursor <= last; cursor += step) {
      let count = 0
      for (let day = cursor; day < cursor + step; day += DAY_MS) {
        count += perDay[new Date(day).toISOString().slice(0, 10)] ?? 0
      }
      points.push({ date: new Date(cursor).toISOString().slice(0, 10), count })
    }
  }

  return send(res, 200, {
    period: { startDate: new Date(start).toISOString(), endDate: new Date(end).toISOString() },
    totalCreatedINperiod: total,
    comparisonWithPreviousPeriod: {
      previousPeriod: { startDate: new Date(prevStart).toISOString(), endDate: new Date(prevEnd).toISOString() },
      previousTotal,
      difference,
      percentChange: previousTotal === 0 ? null : Math.round((difference / previousTotal) * 1000) / 10,
    },
    countByStatusInPeriod: countBy(inPeriod, (apac) => apac.status),
    countByStatus: countBy(apacs, (apac) => apac.status),
    countByProcedureInPeriod: countBy(inPeriod, (apac) => apac.procedure),
    countByPriorityInPeriod: countBy(inPeriod, (apac) => apac.priority),
    countByAcsInPeriod: countBy(inPeriod, (apac) => apac.acs),
    countByMunicipalityInPeriod: countBy(inPeriod, (apac) => apac.municipality || "NAO_INFORMADO"),
    pendingQueue: { statuses: ["PENDENTE", "AGUARDO"], total: queue.length, byPriority },
    createdOverTime: { interval, timeZone: "America/Fortaleza", points },
  })
}

// ---------------------------------------------------------------------------
// /documents
// ---------------------------------------------------------------------------

/** Formato MMAAAA + sequencial do mês, ex: "08202600001". Só para o mock — a API real define o algoritmo. */
function nextProtocolNumber() {
  const now = new Date()
  const mm = String(now.getMonth() + 1).padStart(2, "0")
  const yyyy = String(now.getFullYear())
  const prefix = `${mm}${yyyy}`

  const sequence = db.data.documents.filter((document) => document.protocol_number.startsWith(prefix)).length + 1

  return `${prefix}${String(sequence).padStart(5, "0")}`
}

async function createDocument(req, res) {
  const body = await readJsonBody(req)
  if (!body) return send(res, 400, { message: "Corpo da requisição deve ser um objeto JSON." })

  if (!body.name) return send(res, 400, { message: "name é obrigatório." })
  if (!DOCUMENT_DESTINATIONS.includes(body.destination)) {
    return send(res, 400, { message: `destination inválido. Valores aceitos: ${DOCUMENT_DESTINATIONS.join(", ")}.` })
  }
  if (body.destination === "OUTRO" && !body.other_destination) {
    return send(res, 400, { message: "other_destination é obrigatório quando destination é OUTRO." })
  }

  const now = new Date().toISOString()
  const document = {
    id: randomUUID(),
    protocol_number: nextProtocolNumber(),
    name: String(body.name).toUpperCase(),
    ...(body.note ? { note: String(body.note) } : {}),
    destination: body.destination,
    ...(body.destination === "OUTRO" ? { other_destination: String(body.other_destination) } : {}),
    status: "SOLICITADO", // `status` nunca vem do cliente
    createdAt: now,
    updatedAt: now,
  }

  db.data.documents.push(document)
  await db.write()

  // Espelha a API real: o backend não recebe o PDF, só devolve uma presigned URL
  // pro cliente fazer o PUT direto no bucket (aqui, num endpoint local que imita
  // o R2, `exp` incluso) — mesmo esquema de `createApac`.
  const uploadUrl = mockPdfUrl(document.id, UPLOAD_TTL_MS)

  return send(res, 201, { document, uploadUrl })
}

async function updateDocument(req, res, id) {
  const body = await readJsonBody(req)
  if (!body) return send(res, 400, { message: "Corpo da requisição deve ser um objeto JSON." })

  const document = db.data.documents.find((entry) => entry.id === id)
  if (!document) return send(res, 404, { error: "Documento não encontrado." })

  if (body.status !== undefined && !DOCUMENT_STATUSES.includes(body.status)) {
    return send(res, 400, { message: `status inválido. Valores aceitos: ${DOCUMENT_STATUSES.join(", ")}.` })
  }

  if (body.name !== undefined) document.name = String(body.name).toUpperCase()
  if (body.note !== undefined) document.note = String(body.note)
  if (body.status !== undefined) document.status = body.status
  document.updatedAt = new Date().toISOString()

  await db.write()

  return send(res, 200, document)
}

/** `DELETE /documents/:id` — apaga o registro e o PDF (aqui, o arquivo em `uploads/`). 204 sem corpo; 404 se não existe. */
async function deleteDocument(res, id) {
  const index = db.data.documents.findIndex((entry) => entry.id === id)
  if (index === -1) return send(res, 404, { error: "Documento não encontrado." })

  db.data.documents.splice(index, 1)
  await db.write()
  rmSync(join(UPLOADS_DIR, `${id}.pdf`), { force: true })

  res.writeHead(204)
  return res.end()
}

// ---------------------------------------------------------------------------
// POST /itens
// ---------------------------------------------------------------------------

async function createItem(req, res, user) {
  const fail = (details) => {
    console.warn("POST /itens inválido:", Object.keys(details).join(", "))
    return send(res, 500, { error: "Erro ao criar item" })
  }

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
              destination: "Estoque inicial",
              description: `Item ${name} foi criado no estoque com ${amount} unidades.`,
              dateTime: new Date().toISOString(),
            },
          ]
        : [],
  }
  if (item.movements[0]) item.movements[0].itemId = item.id

  db.data.itens.push(item)
  await db.write()

  // Espelha a API real: o backend nunca recebe a imagem, só devolve uma
  // presigned URL pro cliente fazer o PUT direto no bucket — sempre, mesmo
  // sem o cliente ter escolhido uma foto (mesmo esquema do PDF das APACs).
  // Sem `image_type`/restrição de Content-Type: a key é `itens/<id>`, sem
  // extensão, e o upload aceita qualquer mime de imagem.
  const uploadUrl = mockItemImageUrl(item.id, UPLOAD_TTL_MS)

  return send(res, 201, { item, uploadUrl })
}

// ---------------------------------------------------------------------------
// POST /itens/:id/movements
// ---------------------------------------------------------------------------

async function createItemMovement(req, res, itemId, user) {
  const body = await readJsonBody(req)
  if (!body) return send(res, 400, { error: "Corpo da requisição deve ser um objeto JSON." })

  if (!MOVEMENT_TYPES.includes(body.movementType)) {
    return send(res, 400, { message: `movementType inválido. Valores aceitos: ${MOVEMENT_TYPES.join(", ")}.` })
  }

  const amount = Number(body.amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    return send(res, 400, { message: "amount deve ser um número maior que zero." })
  }

  if (!body.destination) {
    return send(res, 400, { message: "destination é obrigatório." })
  }

  const item = db.data.itens.find((entry) => entry.id === itemId)
  if (!item) return send(res, 404, { error: "Item não encontrado." })

  const author = db.data.users.find((entry) => entry.id === user.id)
  if (!author) return send(res, 500, { message: "Usuário não encontrado." })

  if (body.movementType === "SAIDA" && amount > item.amount) {
    return send(res, 400, { error: "Estoque insuficiente para esta saída." })
  }

  item.amount = body.movementType === "ENTRADA" ? item.amount + amount : item.amount - amount

  const destination = String(body.destination)
  const description =
    body.movementType === "ENTRADA"
      ? `${author.name} registrou a adição de ${amount} unidades de ${item.name} ao estoque.`
      : `${author.name} registrou a saída de ${amount} unidades de ${item.name} vindas de ${destination} ao estoque.`

  const movement = {
    id: randomUUID(),
    itemId: item.id,
    userId: user.id,
    movementType: body.movementType,
    amount,
    destination,
    description,
    dateTime: new Date().toISOString(),
  }

  item.movements ??= []
  item.movements.unshift(movement)

  await db.write()

  // Espelha a API real: o backend não recebe a foto comprovante, só devolve
  // uma presigned URL pro cliente fazer o PUT direto no bucket — sempre,
  // mesmo esquema da foto do item e do PDF das APACs.
  const uploadUrl = mockMovementImageUrl(movement.id, UPLOAD_TTL_MS)

  return send(res, 201, { item, uploadUrl })
}

// ---------------------------------------------------------------------------
// /mock-uploads/:filename — imita as presigned URLs (PUT de upload, GET de
// download) que a API real gera a partir do Cloudflare R2, tanto para o PDF
// das APACs quanto para a imagem dos itens.
// ---------------------------------------------------------------------------

function mockPdfUrl(id, ttlMs) {
  return `http://${HOST}:${PORT}/mock-uploads/${id}.pdf?exp=${Date.now() + ttlMs}`
}

/** Injeta `pdf_url` (e `has_pdf`, `false` em registros antigos) em cada APAC, como a API real faz. */
function withPdfUrl(apac) {
  return apac?.id ? { ...apac, has_pdf: apac.has_pdf ?? false, pdf_url: mockPdfUrl(apac.id, DOWNLOAD_TTL_MS) } : apac
}

/**
 * `POST /apacs/:id/pdf/upload-url` e `POST /apacs/:id/pdf/confirm` — espelham
 * `.docs/temp/CONTRATO_PDF_APACS.md`. O `confirm` confere se o arquivo chegou em
 * `uploads/` antes de marcar `has_pdf` (409 se não chegou).
 */
async function handleApacPdf(res, id, action) {
  const apac = db.data.apacs.find((item) => item.id === id)
  if (!apac) return send(res, 404, { error: "APAC não encontrada." })

  if (action === "upload-url") return send(res, 200, { uploadUrl: mockPdfUrl(id, UPLOAD_TTL_MS) })

  if (!existsSync(join(UPLOADS_DIR, `${id}.pdf`))) {
    return send(res, 409, {
      error: "O PDF ainda não foi recebido. Envie o arquivo pela uploadUrl e confirme de novo.",
    })
  }

  apac.has_pdf = true
  apac.updated_at = new Date().toISOString()
  await db.write()
  return send(res, 200, withPdfUrl(apac))
}

// Nome do arquivo em disco não usa `/` — só a chave lógica (`itens/<id>`, sem
// extensão, como a API real) imita o path do bucket.
function itemImageFilename(id) {
  return `itens-${id}`
}

function mockItemImageUrl(id, ttlMs) {
  return `http://${HOST}:${PORT}/mock-uploads/${itemImageFilename(id)}?exp=${Date.now() + ttlMs}`
}

// Mesma lógica de `itemImageFilename`, mas para a foto comprovante de um movimento.
function movementImageFilename(id) {
  return `movements-${id}`
}

function mockMovementImageUrl(id, ttlMs) {
  return `http://${HOST}:${PORT}/mock-uploads/${movementImageFilename(id)}?exp=${Date.now() + ttlMs}`
}

/**
 * Injeta `image_url` no item e em cada movimento do histórico — sempre,
 * tenha foto enviada ou não (mesmo comportamento do `pdf_url`).
 */
function withImageUrl(item) {
  if (!item?.id) return item
  return {
    ...item,
    image_url: mockItemImageUrl(item.id, DOWNLOAD_TTL_MS),
    movements: (item.movements ?? []).map((movement) => ({
      ...movement,
      image_url: mockMovementImageUrl(movement.id, DOWNLOAD_TTL_MS),
    })),
  }
}

// Sem `image_type`/restrição de Content-Type no contrato: a key do item não
// tem extensão, então (ao contrário do `.pdf` fixo das APACs) o `Content-Type`
// da resposta de download precisa vir de algum lugar — gravamos o que o
// cliente mandou no `PUT` num arquivo `.contenttype` ao lado do arquivo.
function contentTypePath(filename) {
  return join(UPLOADS_DIR, `${filename}.contenttype`)
}

function contentTypeForUpload(filename) {
  if (filename.endsWith(".pdf")) return "application/pdf"
  return "application/octet-stream"
}

async function readRawBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return Buffer.concat(chunks)
}

async function uploadMockFile(req, res, filename, searchParams) {
  const exp = Number(searchParams.get("exp"))
  if (!Number.isFinite(exp) || Date.now() > exp) {
    return send(res, 403, { message: "Link de upload expirado." })
  }

  const body = await readRawBody(req)
  await writeFile(join(UPLOADS_DIR, filename), body)
  await writeFile(contentTypePath(filename), req.headers["content-type"] ?? "")

  return send(res, 200, { ok: true })
}

async function downloadMockFile(req, res, filename, searchParams) {
  const exp = Number(searchParams.get("exp"))
  if (!Number.isFinite(exp) || Date.now() > exp) {
    return send(res, 403, { message: "Link de download expirado." })
  }

  const filePath = join(UPLOADS_DIR, filename)
  if (!existsSync(filePath)) {
    return send(res, 404, { message: "Nenhum arquivo enviado ainda." })
  }

  const storedContentType = existsSync(contentTypePath(filename))
    ? (await readFile(contentTypePath(filename), "utf8")).trim()
    : ""

  res.writeHead(200, { ...CORS_HEADERS, "content-type": storedContentType || contentTypeForUpload(filename) })
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
      { method: "GET", path: "/auth/admin", roles: ALL_EXCEPT_RECEPCIONISTA.join(", ") },
      { method: "POST", path: "/users", roles: ACCESS.users.join(", ") },
      { method: "GET", path: "/users", roles: ACCESS.users.join(", ") },
      { method: "GET", path: "/users/:id", roles: `${ACCESS.users.join(", ")} (extra do mock)` },
      { method: "POST", path: "/apacs", roles: ACCESS.apacs.join(", ") },
      { method: "GET", path: "/apacs", roles: ACCESS.apacs.join(", ") },
      { method: "GET", path: "/apacs/:id", roles: `${ACCESS.apacs.join(", ")} (extra do mock)` },
      { method: "PATCH", path: "/apacs/:id", roles: ACCESS.apacs.join(", ") },
      { method: "POST", path: "/apacs/:id/pdf/upload-url", roles: ACCESS.apacs.join(", ") },
      { method: "POST", path: "/apacs/:id/pdf/confirm", roles: ACCESS.apacs.join(", ") },
      { method: "PUT", path: "/apacs/:id", roles: `${ACCESS.apacs.join(", ")} (extra do mock)` },
      { method: "DELETE", path: "/apacs/:id", roles: ALL_EXCEPT_RECEPCIONISTA.join(", ") },
      { method: "POST", path: "/itens", roles: ACCESS.itens.join(", ") },
      { method: "GET", path: "/itens", roles: ACCESS.itens.join(", ") },
      { method: "PATCH | DELETE", path: "/itens/:id", roles: ACCESS.itens.join(", ") },
      { method: "POST", path: "/itens/:id/movements", roles: ACCESS.itens.join(", ") },
      { method: "POST", path: "/documents", roles: ACCESS.documents.join(", ") },
      { method: "GET", path: "/documents", roles: ALL_EXCEPT_RECEPCIONISTA.join(", ") },
      { method: "PATCH | DELETE", path: "/documents/:id", roles: ALL_EXCEPT_RECEPCIONISTA.join(", ") },
      { method: "POST", path: "/reports/apacs", roles: ACCESS.reports.join(", ") },
      {
        method: "PUT",
        path: "/mock-uploads/:filename?exp=...",
        roles: "nenhuma (imita a presigned URL de upload do R2 devolvida por POST /apacs e POST /itens)",
      },
      {
        method: "GET",
        path: "/mock-uploads/:filename?exp=...",
        roles: "nenhuma (imita a presigned URL de download do R2 devolvida em pdf_url/image_url)",
      },
    ],
  }
}

// ---------------------------------------------------------------------------
// GET /apacs | /documents | /itens | /users — paginado (`{ data, pagination }`)
// ---------------------------------------------------------------------------

/** Valores aceitos em `?status=` por listagem. Em `/users` o parâmetro filtra o `role`. */
const LIST_STATUS = {
  apacs: { field: "status", values: ["PENDENTE", "AGUARDO", "APROVADO", "CANCELADO", "NEGADO", "ENTREGUE"] },
  documents: { field: "status", values: DOCUMENT_STATUSES },
  itens: { field: "status", values: ["DISPONIVEL", "EMPRESTADO"] },
  users: { field: "role", values: ROLES },
}

const LIST_DECORATOR = { apacs: withPdfUrl, documents: withPdfUrl, itens: withImageUrl, users: (user) => user }

const badRequest = (message) => ({ status: 400, body: { statusCode: 400, error: "Bad Request", message } })

function parseIntParam(searchParams, name, fallback, min, max) {
  const raw = searchParams.get(name)
  if (raw === null) return { value: fallback }
  const value = Number(raw)
  if (!Number.isInteger(value) || value < min || value > max) {
    return { error: badRequest(`querystring/${name} must be >= ${min}${max === Infinity ? "" : ` and <= ${max}`}`) }
  }
  return { value }
}

/**
 * Filtros extras de `GET /apacs`: `priority`, `municipality` (nome inteiro, sem caixa; `NAO_INFORMADO`
 * = sem município) e `startDate`/`endDate` (`YYYY-MM-DD` = dia inteiro no horário de Brasília, ou ISO
 * com hora; cada um vale sozinho). Formato ou ordem inválidos → 400 em português.
 */
function parseApacFilters(searchParams) {
  const priority = searchParams.get("priority")
  if (priority !== null && !PRIORITIES.includes(priority)) {
    return { error: badRequest("querystring/priority must be equal to one of the allowed values") }
  }

  const parseDate = (name, endOfDay) => {
    const raw = searchParams.get(name)
    if (raw === null) return { value: null }
    const dayOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    if (dayOnly) {
      const [year, month, day] = raw.split("-").map(Number)
      const probe = new Date(Date.UTC(year, month - 1, day))
      if (probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) {
        return { error: { status: 400, body: { error: `"${name}" não é uma data válida.` } } }
      }
      const ms = Date.UTC(year, month - 1, day) + BRT_OFFSET_MS + (endOfDay ? DAY_MS - 1 : 0)
      return { value: ms }
    }
    const ms = /^\d{4}-\d{2}-\d{2}T/.test(raw) ? Date.parse(raw) : Number.NaN
    if (Number.isNaN(ms)) {
      return { error: { status: 400, body: { error: `"${name}" deve estar no formato AAAA-MM-DD.` } } }
    }
    return { value: ms }
  }

  const start = parseDate("startDate", false)
  if (start.error) return start
  const end = parseDate("endDate", true)
  if (end.error) return end
  if (start.value !== null && end.value !== null && start.value > end.value) {
    return { error: { status: 400, body: { error: '"startDate" deve ser anterior ou igual a "endDate".' } } }
  }

  const municipality = searchParams.get("municipality")?.toLowerCase() ?? null

  return {
    matches: (apac) => {
      if (priority !== null && apac.priority !== priority) return false
      if (municipality !== null) {
        const value = apac.municipality ? String(apac.municipality).toLowerCase() : null
        if (municipality === "nao_informado" ? value !== null : value !== municipality) return false
      }
      const created = createdAtMs(apac)
      if (start.value !== null && created < start.value) return false
      if (end.value !== null && created > end.value) return false
      return true
    },
  }
}

const createdAtMs = (record) => new Date(record.createdAt ?? record.created_at ?? 0).getTime()

/** Mesmas regras da API real: `page>=1`, `pageSize` 1–100 (padrão 50), `search` por nome, `status` exato. */
function listCollection(res, collection, searchParams) {
  const page = parseIntParam(searchParams, "page", 1, 1, Infinity)
  if (page.error) return sendError(res, page.error)
  const pageSize = parseIntParam(searchParams, "pageSize", 50, 1, 100)
  if (pageSize.error) return sendError(res, pageSize.error)

  const search = searchParams.get("search")
  if (search !== null && search.length > 100) {
    return sendError(res, badRequest("querystring/search must NOT have more than 100 characters"))
  }

  const status = searchParams.get("status")
  const statusRule = LIST_STATUS[collection]
  if (status !== null && !statusRule.values.includes(status)) {
    return sendError(res, badRequest("querystring/status must be equal to one of the allowed values"))
  }

  const extra = collection === "apacs" ? parseApacFilters(searchParams) : { matches: () => true }
  if (extra.error) return sendError(res, extra.error)

  const term = search?.trim().toLowerCase() ?? ""
  const filtered = (db.data[collection] ?? [])
    .filter((record) => term === "" || String(record.name ?? "").toLowerCase().includes(term))
    .filter((record) => status === null || record[statusRule.field] === status)
    .filter((record) => extra.matches(record))
    .sort((a, b) =>
      collection === "users" ? String(a.name).localeCompare(String(b.name), "pt-BR") : createdAtMs(b) - createdAtMs(a)
    )

  const total = filtered.length
  const start = (page.value - 1) * pageSize.value
  return send(res, 200, {
    data: filtered.slice(start, start + pageSize.value).map(LIST_DECORATOR[collection]),
    pagination: { page: page.value, pageSize: pageSize.value, total, totalPages: Math.ceil(total / pageSize.value) },
  })
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
    if (method === "PUT") return uploadMockFile(req, res, rest[0], searchParams)
    if (method === "GET") return downloadMockFile(req, res, rest[0], searchParams)
  }

  if (collection === "auth") return handleAuth(req, res, rest)

  // `/itens/:id/movements` é a única rota aninhada — todo o resto continua limitado a `/:collection[/:id]`.
  const isItemMovementsRoute = collection === "itens" && rest.length === 2 && rest[1] === "movements"
  const isApacPdfRoute =
    collection === "apacs" && rest.length === 3 && rest[1] === "pdf" && ["upload-url", "confirm"].includes(rest[2])

  // Whitelist: o json-server exporia qualquer chave do db.json como endpoint,
  // inclusive `_credentials`.
  const roles = ACCESS[collection]
  if (!roles || (rest.length > 1 && !isItemMovementsRoute && !isApacPdfRoute)) return send(res, 404, { message: "Rota não encontrada." })

  const { user, error } = authenticate(req)
  if (error) return sendError(res, error)

  const denied = authorize(user, rolesFor(collection, method, rest)).error
  if (denied) return sendError(res, denied)

  if (isApacPdfRoute) {
    if (method !== "POST") return send(res, 404, { message: "Rota não encontrada." })
    return handleApacPdf(res, rest[0], rest[2])
  }

  if (method === "POST" && isItemMovementsRoute) {
    return createItemMovement(req, res, rest[0], user)
  }

  if (method === "POST" && rest.length === 0) {
    if (collection === "users") return createUser(req, res, user)
    if (collection === "apacs") return createApac(req, res)
    if (collection === "itens") return createItem(req, res, user)
    if (collection === "documents") return createDocument(req, res)
  }

  // `reports` não é coleção do json-server: só `POST /reports/apacs` existe.
  if (collection === "reports") {
    if (method === "POST" && rest.length === 1 && rest[0] === "apacs") return reportApacs(req, res)
    return send(res, 404, { message: "Rota não encontrada." })
  }

  if (method === "PATCH" && collection === "documents" && rest.length === 1) {
    return updateDocument(req, res, rest[0])
  }

  if (method === "DELETE" && collection === "documents" && rest.length === 1) {
    return deleteDocument(res, rest[0])
  }

  // Listagens paginadas, como na API real — não vão para o json-server (que
  // devolveria um array e aceitaria `_sort`, `_page` etc., que a API não tem).
  if (method === "GET" && rest.length === 0) {
    return listCollection(res, collection, new URL(req.url ?? "/", `http://${HOST}:${PORT}`).searchParams)
  }

  // `pdf_url`/`image_url` são gerados sob demanda a cada GET, como na API real.
  // GET por id é extra do mock (a API real não tem).
  if (method === "GET" && collection === "apacs") {
    const searchParams = new URL(req.url ?? "/", `http://${HOST}:${PORT}`).searchParams
    if (rest.length === 1 && searchParams.size === 0) {
      const found = db.data.apacs.find((item) => item.id === rest[0])
      if (!found) return send(res, 404, { message: "APAC não encontrada." })
      return send(res, 200, withPdfUrl(found))
    }
  }

  if (method === "GET" && collection === "itens") {
    const searchParams = new URL(req.url ?? "/", `http://${HOST}:${PORT}`).searchParams
    if (rest.length === 1 && searchParams.size === 0) {
      const found = db.data.itens.find((item) => item.id === rest[0])
      if (!found) return send(res, 404, { message: "Item não encontrado." })
      return send(res, 200, withImageUrl(found))
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
