/**
 * Client HTTP da API. Ponto único de saída do frontend para a rede.
 *
 * Responsabilidades: montar a URL, anexar o `Bearer`, serializar JSON, aplicar
 * timeout e normalizar erro. Nenhum componente deve chamar `fetch` direto.
 */

import { clearToken, getToken } from "@/lib/session"

/** Base das chamadas — ver `.env.example`. Embutida no bundle em build time. */
const API_URL = import.meta.env.VITE_API_URL ?? "/api"

/**
 * Generoso de propósito: serviço hobby da Railway hiberna e a primeira requisição
 * depois do cold start leva vários segundos.
 */
const TIMEOUT_MS = 20_000

/** Erro normalizado da API. `status` 0 significa que a requisição nem chegou lá. */
export class ApiError extends Error {
  readonly status: number
  /**
   * Corpo cru da resposta de erro. **Nunca renderize nem logue**: o `details` do
   * `POST /apecs` pode conter os dados do paciente que falharam na validação.
   */
  readonly details: unknown

  constructor(status: number, message: string, details?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.details = details
  }
}

const STATUS_MESSAGE: Record<number, string> = {
  0: "Não foi possível falar com a API. Verifique sua conexão e tente novamente.",
  400: "Dados inválidos. Revise os campos e tente novamente.",
  401: "Sua sessão expirou. Entre novamente.",
  403: "Acesso negado. Seu perfil não tem permissão para esta ação.",
  404: "Recurso não encontrado.",
  409: "Este registro já existe.",
}

/** A API mistura `{ message }` (auth/users) e `{ error, details }` (apecs). */
function extractMessage(payload: unknown) {
  if (typeof payload !== "object" || payload === null) {
    return null
  }

  const { message, error } = payload as Record<string, unknown>

  if (typeof message === "string" && message.length > 0) {
    return message
  }

  if (typeof error === "string" && error.length > 0) {
    return error
  }

  return null
}

async function readPayload(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined
  }

  const text = await response.text()
  if (text.length === 0) {
    return undefined
  }

  try {
    return JSON.parse(text)
  } catch {
    // Erro de gateway costuma vir em HTML; o texto cru ainda ajuda no debug.
    return text
  }
}

export type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"
  body?: unknown
  signal?: AbortSignal
  /** `false` apenas em rotas públicas (`POST /auth/login`). */
  auth?: boolean
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, signal, auth = true } = options

  const headers = new Headers()
  if (body !== undefined) {
    headers.set("Content-Type", "application/json")
  }

  if (auth) {
    const token = getToken()
    if (token !== null) {
      headers.set("Authorization", `Bearer ${token}`)
    }
  }

  const timeout = AbortSignal.timeout(TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: signal === undefined ? timeout : AbortSignal.any([signal, timeout]),
    })
  } catch (error) {
    // Cancelamento vindo do React Query não é falha: propaga como está para ele
    // não tratar a query como erro.
    if (signal?.aborted === true) {
      throw error
    }

    const timedOut = timeout.aborted
    throw new ApiError(0, timedOut ? "A API demorou demais para responder. Tente novamente." : STATUS_MESSAGE[0], error)
  }

  if (response.status === 401) {
    // Não existe refresh token no contrato: 401 é fim de sessão, sem recuperação.
    // Limpar aqui faz as guardas de rota reagirem sozinhas.
    clearToken()
  }

  const payload = await readPayload(response)

  if (!response.ok) {
    const message = extractMessage(payload) ?? STATUS_MESSAGE[response.status] ?? "Erro inesperado na API."
    throw new ApiError(response.status, message, payload)
  }

  return payload as T
}
