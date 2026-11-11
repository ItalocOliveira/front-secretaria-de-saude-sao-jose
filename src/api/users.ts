import type { UserRole } from "@/lib/apac"
import { request } from "@/api/client"
import { toListQuery, type ListParams, type Paginated } from "@/api/pagination"

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

/** `GET /users` paginado, em ordem alfabética. `status` aqui filtra pelo cargo (`?status=RECEPCIONISTA`). */
export function listUsers(params: ListParams<UserRole>, signal?: AbortSignal) {
  return request<Paginated<UserDto>>(`/users${toListQuery(params)}`, { signal })
}

/**
 * `POST /users` — todos os cargos menos `RECEPCIONISTA`. Só `DEV` cria `DEV` (`403` para os
 * outros); CPF já cadastrado → `409`.
 */
export function createUser(payload: CreateUserPayload) {
  return request<UserDto>("/users", { method: "POST", body: payload })
}
