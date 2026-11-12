import type { ItemStatus, ItemType, MovementType } from "@/lib/itens"
import { request } from "@/api/client"
import { toListQuery, type ListParams, type Paginated } from "@/api/pagination"

export type ItemMovementDto = {
  id: string
  itemId: string
  /**
   * Id de quem registrou. `"SISTEMA"` no ajuste automático de inventário que a API gera uma vez
   * para itens antigos cujo histórico não fechava com o estoque (`destination: "Ajuste de inventário"`,
   * `description` começando com `"Ajuste automático de inventário: ..."`, sem foto).
   */
  userId: string
  movementType: MovementType
  amount: number
  destination: string
  description: string
  dateTime: string
  /**
   * Presigned URL de download, válida por 1h, gerada a cada `GET /itens` —
   * presente mesmo que nenhuma foto de comprovação tenha sido enviada (mesmo
   * comportamento do `image_url` do item e do `pdf_url` das APACs).
   */
  image_url?: string
}

/** `ItemDomain` do backend — `status` sai `DISPONIVEL` por padrão. `movements` vem do mais recente para o mais antigo. */
export type ItemDto = {
  id: string
  name: string
  status: ItemStatus
  description?: string
  amount: number
  /**
   * Quantidade mínima em estoque: abaixo dela (`amount < min_amount`) o item entra no sino
   * (`GET /notifications`). `0` = sem alerta — padrão dos itens antigos.
   */
  min_amount: number
  type: ItemType
  movements: ItemMovementDto[]
  /**
   * Presigned URL de download, válida por 1h, gerada a cada `GET /itens` —
   * presente mesmo que nenhuma foto tenha sido enviada ainda (mesmo
   * comportamento do `pdf_url` das APACs), então não usar como indicador de
   * "tem foto". Não vem tipado no `ItemDomain` do backend (injetado via spread).
   */
  image_url?: string
}

/**
 * `amount` é opcional, inteiro de 0 a 1.000.000 — omitido ou `0` cria o produto
 * sem estoque (sem movimento no histórico). Se vier `> 0`, a API cria uma
 * `ENTRADA` automática (`destination: "Estoque inicial"`) com a descrição
 * `"<usuário> cadastrou o item <NOME> no estoque com N unidades."`.
 * `404` `"Usuário não encontrado."` se quem está logado não existe mais no município.
 */
export type CreateItemPayload = {
  name: string
  description?: string
  type: ItemType
  amount?: number
  /** Inteiro de 0 a 1.000.000, opcional (padrão `0` = sem alerta de estoque baixo). */
  min_amount?: number
}

export type CreateItemResult = {
  item: ItemDto
  /** Presigned PUT do Cloudflare R2, válida por 15 min, sempre devolvida. Usar com `uploadItemImage`. */
  uploadUrl: string
}

/**
 * Todos os campos opcionais — envie só o que for alterar. Não gera movimento nem mexe na foto.
 * **Sem `amount`**: a API ignora a quantidade no `PATCH` — o estoque só muda por
 * `createItemMovement` (`ENTRADA` soma, `SAIDA` subtrai), para o histórico sempre fechar com o saldo.
 * `min_amount` **é** editável: é só o limite do alerta, não mexe no estoque.
 */
export type UpdateItemPayload = {
  name?: string
  description?: string
  status?: ItemStatus
  type?: ItemType
  min_amount?: number
}

/**
 * `itemId` vem da URL e `userId` do token — a `description` é gerada pela API.
 * `amount` é inteiro de 1 a 1.000.000. Duas saídas simultâneas que passem do
 * estoque: a segunda recebe `400` `"Estoque insuficiente para esta saída."`.
 * `destination` é obrigatório para os dois tipos de movimento (entrada e
 * saída), sem enum/whitelist no backend.
 */
export type CreateItemMovementPayload = {
  movementType: MovementType
  amount: number
  destination: string
}

/** `GET /itens` paginado, mais recentes primeiro. */
export function listItens(params: ListParams<ItemStatus>, signal?: AbortSignal) {
  return request<Paginated<ItemDto>>(`/itens${toListQuery(params)}`, { signal })
}

export function createItem(payload: CreateItemPayload) {
  return request<CreateItemResult>("/itens", { method: "POST", body: payload })
}

export function updateItem(id: string, payload: UpdateItemPayload) {
  return request<ItemDto>(`/itens/${id}`, { method: "PATCH", body: payload })
}

/** `404` se o `id` não existir (ou for de outro município). A imagem no bucket é apagada junto (idempotente). */
export async function deleteItem(id: string): Promise<void> {
  await request<undefined>(`/itens/${id}`, { method: "DELETE" })
}

/**
 * PUT direto pro bucket com a presigned URL devolvida por `createItem`. O backend nunca
 * vê o arquivo, então isso **não** passa por `request()`: sem `Bearer`. Não há edição de
 * foto depois de criado o item (mesma lacuna do PDF nas APACs — `PATCH` não mexe nisso).
 * `fetch` usa o `Content-Type` do próprio `File` automaticamente; a assinatura não
 * restringe o mime. Se a URL expirou (>15 min), o `PUT` volta 403.
 */
export async function uploadItemImage(uploadUrl: string, file: File, signal?: AbortSignal) {
  let response: Response
  try {
    response = await fetch(uploadUrl, { method: "PUT", body: file, signal })
  } catch (error) {
    if (signal?.aborted === true) {
      throw error
    }
    throw new Error("Não foi possível enviar a imagem. Verifique sua conexão e tente novamente.", { cause: error })
  }

  if (!response.ok) {
    throw new Error(
      response.status === 403
        ? "O link de envio expirou (validade de 15 minutos). O produto já foi salvo; tente reenviar a imagem."
        : "Não foi possível enviar a imagem."
    )
  }
}

export type CreateItemMovementResult = {
  item: ItemDto
  /** Presigned PUT do Cloudflare R2, válida por 15 min, sempre devolvida. Usar com `uploadItemImage`. */
  uploadUrl: string
}

/** `404` `"Item não encontrado."` · `400` `"Estoque insuficiente para esta saída."`. */
export function createItemMovement(id: string, payload: CreateItemMovementPayload) {
  return request<CreateItemMovementResult>(`/itens/${id}/movements`, { method: "POST", body: payload })
}
