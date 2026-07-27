/**
 * Sessão do usuário — o token JWT e o que dá para derivar dele.
 *
 * ## Onde o token mora: `sessionStorage`
 *
 * Decisão registrada em `.docs/integracao-api.md`. Resumo: `sessionStorage`
 * sobrevive ao F5 (a API não tem refresh token, então perder o token significa
 * novo login) mas morre ao fechar a aba — importante porque as unidades de saúde
 * usam terminais compartilhados e ninguém deve herdar a sessão do colega.
 * Continua exposto a XSS, como qualquer storage acessível por JS.
 *
 * Implementado como store externo (`subscribe`/`getToken`) para ser consumido via
 * `useSyncExternalStore`: o client HTTP consegue derrubar a sessão em um `401` e
 * a árvore React reage sem precisar de Context.
 */

import { USER_ROLE, type UserRole } from "@/lib/apac"

/** Versionado: se o formato mudar, a chave antiga é simplesmente ignorada. */
const STORAGE_KEY = "sjr.auth.token.v1"

/**
 * Claims que expomos ao app.
 *
 * O payload do JWT também traz `cpf`, deliberadamente **omitido** aqui: CPF é dado
 * pessoal de saúde e nenhum componente deve conseguir renderizá-lo por descuido.
 */
export type SessionClaims = {
  id: string
  role: UserRole
  /** Expiração em segundos desde a epoch (padrão JWT). */
  exp: number
}

function readStorage() {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY)
  } catch {
    // Storage pode estar indisponível (modo privado, política do navegador).
    return null
  }
}

function writeStorage(token: string | null) {
  try {
    if (token === null) {
      window.sessionStorage.removeItem(STORAGE_KEY)
    } else {
      window.sessionStorage.setItem(STORAGE_KEY, token)
    }
  } catch {
    // Sem storage a sessão vive só em memória: degrada, não quebra.
  }
}

function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && Object.hasOwn(USER_ROLE, value)
}

/** Decodifica o payload sem validar assinatura — quem valida é a API. */
export function decodeToken(token: string): SessionClaims | null {
  const payload = token.split(".").at(1)
  if (payload === undefined) {
    return null
  }

  try {
    const json: unknown = JSON.parse(atob(payload.replaceAll("-", "+").replaceAll("_", "/")))

    if (typeof json !== "object" || json === null) {
      return null
    }

    // A API emite o id do usuário em `sub` (subject, padrão JWT); `id` fica como
    // tolerância caso o backend passe a nomear a claim assim.
    const { sub, id, role, exp } = json as Record<string, unknown>
    const userId = typeof sub === "string" ? sub : id

    if (typeof userId !== "string" || !isUserRole(role) || typeof exp !== "number") {
      return null
    }

    return { id: userId, role, exp }
  } catch {
    // Token malformado equivale a não ter sessão.
    return null
  }
}

function isExpired(claims: SessionClaims) {
  return claims.exp * 1000 <= Date.now()
}

/** Descarta na inicialização o que já não serve — evita um 401 garantido no boot. */
function readInitialToken() {
  const stored = readStorage()
  if (stored === null) {
    return null
  }

  const claims = decodeToken(stored)
  if (claims === null || isExpired(claims)) {
    writeStorage(null)
    return null
  }

  return stored
}

let token = readInitialToken()
let expiryTimer: ReturnType<typeof setTimeout> | undefined

const listeners = new Set<() => void>()

function notify() {
  for (const listener of listeners) {
    listener()
  }
}

/**
 * Agenda a limpeza para o instante da expiração. Sem isso, uma aba deixada aberta
 * por mais de uma hora só descobriria a sessão morta na próxima requisição.
 */
function scheduleExpiry(claims: SessionClaims | null) {
  clearTimeout(expiryTimer)
  expiryTimer = undefined

  if (claims === null) {
    return
  }

  const delay = claims.exp * 1000 - Date.now()
  // `setTimeout` estoura acima de ~24.8 dias; o token vive 1h, mas o guarda é barato.
  if (delay > 0 && delay < 2_147_483_647) {
    expiryTimer = setTimeout(clearToken, delay)
  }
}

scheduleExpiry(token === null ? null : decodeToken(token))

export function getToken() {
  return token
}

export function setToken(next: string) {
  token = next
  writeStorage(next)
  scheduleExpiry(decodeToken(next))
  notify()
}

export function clearToken() {
  if (token === null) {
    return
  }

  token = null
  writeStorage(null)
  scheduleExpiry(null)
  notify()
}

export function subscribeToSession(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
