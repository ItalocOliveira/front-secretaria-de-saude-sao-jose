import type { UserRole } from "@/lib/apac"
import { request } from "@/api/client"

export type UserDto = {
  id: string
  name: string
  /** Criptografado pela API — não é o CPF legível e não deve ser exibido. */
  cpf_encrypted: string
  role: UserRole
  created_at?: string
  updated_at?: string
}

export type CreateUserPayload = {
  name: string
  cpf: string
  password: string
  role: UserRole
}

export function listUsers(signal?: AbortSignal) {
  return request<UserDto[]>("/users", { signal })
}

/** `POST /users` exige autenticação e role `DEV`, `DIRETOR` ou `SECRETARIA`. */
export function createUser(payload: CreateUserPayload) {
  return request<UserDto>("/users", { method: "POST", body: payload })
}
