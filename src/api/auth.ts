import type { UserRole } from "@/lib/apac"
import { request } from "@/api/client"

export type LoginPayload = {
  cpf: string
  password: string
}

export type LoginResponse = {
  token: string
}

/**
 * Resposta de `GET /auth/me`.
 *
 * O `cpf` vem **hasheado** e não deve ser exibido. Note também que a API não
 * devolve o `name` do usuário — ver a lista de lacunas em
 * `.docs/integracao-api.md`.
 */
export type AuthenticatedUser = {
  id: string
  cpf: string
  role: UserRole
}

/**
 * Logos do município (`.docs/att-backend/2026-11-16-logos-municipio.md`): URLs assinadas do R2
 * que **expiram em 1 hora** — vão direto no `<img src>`, nunca para `localStorage`. `null` = sem logo.
 * Enviadas só pelo painel admin; PNG, JPEG ou WEBP.
 */
export type TenantLogos = {
  prefeitura: string | null
  secretaria: string | null
}

export type TenantLogoKind = keyof TenantLogos

/** Resposta de `GET /auth/tenant`. `slug` serve só para exibir — o header usa o do endereço. */
export type TenantInfo = {
  name: string
  slug: string
  /**
   * `false` = município suspenso pelo painel admin: login dá `403` e as rotas autenticadas
   * dão `401` (`.docs/att-backend/2026-11-13-municipio-suspenso.md`).
   */
  active: boolean
  /** Opcional por segurança: API anterior ao comunicado não manda o campo (= sem logos). */
  logos?: TenantLogos
}

export function login(payload: LoginPayload) {
  return request<LoginResponse>("/auth/login", { method: "POST", body: payload, auth: false })
}

/** Público. Valida o município do endereço: `404` = slug inexistente. */
export function getTenant(signal?: AbortSignal) {
  return request<TenantInfo>("/auth/tenant", { signal, auth: false })
}

export function getAuthenticatedUser(signal?: AbortSignal) {
  return request<AuthenticatedUser>("/auth/me", { signal })
}
