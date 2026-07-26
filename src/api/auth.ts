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

export function login(payload: LoginPayload) {
  return request<LoginResponse>("/auth/login", { method: "POST", body: payload, auth: false })
}

export function getAuthenticatedUser(signal?: AbortSignal) {
  return request<AuthenticatedUser>("/auth/me", { signal })
}
