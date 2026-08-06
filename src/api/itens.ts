import type { ItemStatus } from "@/lib/itens"
import { request } from "@/api/client"

/** `ItemDomain` do backend — `status` sai `DISPONIVEL` e `amount` sai `1` por padrão. */
export type ItemDto = {
  id: string
  name: string
  status: ItemStatus
  description?: string
  amount: number
}

export type CreateItemPayload = {
  name: string
  description?: string
}

/** Todos os campos opcionais — envie só o que for alterar. */
export type UpdateItemPayload = {
  name?: string
  description?: string
  status?: ItemStatus
  amount?: number
}

export function listItens(signal?: AbortSignal) {
  return request<ItemDto[]>("/itens", { signal })
}

export function createItem(payload: CreateItemPayload) {
  return request<ItemDto>("/itens", { method: "POST", body: payload })
}

export function updateItem(id: string, payload: UpdateItemPayload) {
  return request<ItemDto>(`/itens/${id}`, { method: "PATCH", body: payload })
}

/** Sem 404 documentado no contrato — mesmo padrão de `deleteApac`. */
export async function deleteItem(id: string): Promise<void> {
  await request<undefined>(`/itens/${id}`, { method: "DELETE" })
}
