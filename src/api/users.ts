import type { UserRole } from "@/lib/apac"
import { request } from "@/api/client"
import { toListQuery, type ListParams, type Paginated } from "@/api/pagination"

export type UserDto = {
  id: string
  name: string
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
 * `DELETE /users/:id` (`204`) — só `DEV`/`SECRETARIO` (`canDeleteUser`). `400` excluir a si mesmo,
 * `403` cargo sem permissão (ou alvo `DEV` para quem não é `DEV`), `404` inexistente/outro município,
 * `409` o município ficaria sem gestor. A sessão aberta do excluído continua válida até expirar.
 */
export function deleteUser(id: string) {
  return request<void>(`/users/${encodeURIComponent(id)}`, { method: "DELETE" })
}

/**
 * `POST /users` — todos os cargos menos `RECEPCIONISTA`. Só `DEV` cria `DEV` (`403` para os
 * outros); CPF já cadastrado → `409`.
 */
export function createUser(payload: CreateUserPayload) {
  return request<UserDto>("/users", { method: "POST", body: payload })
}
