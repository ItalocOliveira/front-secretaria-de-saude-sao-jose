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
import { copyFileSync, existsSync, rmSync } from "node:fs"
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

const JWT_SECRET = "mock-secret-nao-usar-em-producao"
const TOKEN_TTL_SECONDS = 60 * 60 // 1 hora, como na API real

const ROLES = ["DEV", "SECRETARIA", "DIRETOR", "RECEPCIONISTA", "REGULADOR"]
const PROCEDURES = ["EXAME", "CIRURGIA"]
const PRIORITIES = ["URGENTE", "NORMAL"]

/** Roles com acesso a cada coleção, conforme a matriz de permissões da doc. */
const ACCESS = {
  users: ["DEV", "DIRETOR", "SECRETARIA"],
  apecs: ["DEV", "DIRETOR", "RECEPCIONISTA", "REGULADOR"],
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

const db = new Low(new JSONFile(DB_FILE), {})
await db.read()

db.data ??= {}
db.data.users ??= []
db.data.apecs ??= []
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
// POST /apecs
// ---------------------------------------------------------------------------

async function createApac(req, res) {
  const fail = (details) => send(res, 500, { error: "Erro ao criar Apec", details })

  const body = await readJsonBody(req)
  if (!body) return fail({ message: "Corpo da requisição deve ser um objeto JSON." })

  const details = {}
  if (!body.name) details.name = "Campo obrigatório."
  if (!body.cns) details.cns = "Campo obrigatório."
  if (!PROCEDURES.includes(body.procedure)) details.procedure = `Valores aceitos: ${PROCEDURES.join(", ")}.`
  if (!PRIORITIES.includes(body.priority)) details.priority = `Valores aceitos: ${PRIORITIES.join(", ")}.`
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
    created_at: now,
    updated_at: now,
  }

  db.data.apecs.push(apac)
  await db.write()

  return send(res, 201, apac)
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
      { method: "POST", path: "/apecs", roles: ACCESS.apecs.join(", ") },
      { method: "GET", path: "/apecs", roles: ACCESS.apecs.join(", ") },
      { method: "GET", path: "/apecs/:id", roles: `${ACCESS.apecs.join(", ")} (extra do mock)` },
      { method: "PATCH | PUT | DELETE", path: "/apecs/:id", roles: `${ACCESS.apecs.join(", ")} (extra do mock)` },
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

  if (collection === "auth") return handleAuth(req, res, rest)

  // Whitelist: o json-server exporia qualquer chave do db.json como endpoint,
  // inclusive `_credentials`.
  const roles = ACCESS[collection]
  if (!roles || rest.length > 1) return send(res, 404, { message: "Rota não encontrada." })

  const { user, error } = authenticate(req)
  if (error) return sendError(res, error)

  const denied = authorize(user, roles).error
  if (denied) return sendError(res, denied)

  if (method === "POST" && rest.length === 0) {
    if (collection === "users") return createUser(req, res)
    if (collection === "apecs") return createApac(req, res)
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
