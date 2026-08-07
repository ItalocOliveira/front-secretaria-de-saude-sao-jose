import type { ItemStatus, ItemType, MovementType } from "@/lib/itens"
import { request } from "@/api/client"

export type ItemMovementDto = {
  id: string
  itemId: string
  userId: string
  movementType: MovementType
  amount: number
  description: string
  dateTime: string
}

/** `ItemDomain` do backend — `status` sai `DISPONIVEL` por padrão. `movements` vem do mais recente para o mais antigo. */
export type ItemDto = {
  id: string
  name: string
  status: ItemStatus
  description?: string
  amount: number
  type: ItemType
  movements: ItemMovementDto[]
}

/**
 * `amount` é opcional — omitido ou `0` cria o produto sem estoque (sem
 * movimento no histórico). Se vier `> 0`, a API cria uma `ENTRADA` automática
 * com descrição gerada por ela mesma.
 */
export type CreateItemPayload = {
  name: string
  description?: string
  type: ItemType
  amount?: number
}

/** Todos os campos opcionais — envie só o que for alterar. Não gera movimento. */
export type UpdateItemPayload = {
  name?: string
  description?: string
  status?: ItemStatus
  amount?: number
  type?: ItemType
}

/** `itemId` vem da URL e `userId` do token — a `description` é gerada pela API. */
export type CreateItemMovementPayload = {
  movementType: MovementType
  amount: number
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

/**
 * Erros ainda não diferenciam status HTTP (tudo cai em 500) — trate por
 * `error.message`: `"Item não encontrado."` ou `"Estoque insuficiente para
 * esta saída."`.
 */
export function createItemMovement(id: string, payload: CreateItemMovementPayload) {
  return request<ItemDto>(`/itens/${id}/movements`, { method: "POST", body: payload })
}
