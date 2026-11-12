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
   * `true` só depois do `POST /itens/:id/image/confirm` — é **isto** que diz se o item tem
   * foto, não o `image_url`. Itens antigos podem vir `false` até o backfill do backend; o
   * "Adicionar imagem" resolve.
   */
  has_image: boolean
  /**
   * Presigned URL de download, válida por 1h, gerada a cada `GET /itens` —
   * presente mesmo que nenhuma foto tenha sido enviada ainda (aí dá 404), então
   * use `has_image` para decidir se renderiza. Não vem no `PATCH` nem no `confirm`.
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
  /** Presigned PUT do Cloudflare R2, válida por 15 min, sempre devolvida. Usar com `attachItemImage`. */
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
 * PUT direto pro bucket com uma presigned URL (`createItem`, `requestItemImageUploadUrl` ou a
 * foto comprovante de `createItemMovement`). O backend nunca vê o arquivo, então isso **não**
 * passa por `request()`: sem `Bearer`. A URL não é assinada com um mime fixo — mandamos o tipo
 * real do arquivo para o navegador exibir certo depois. Se a URL expirou (>15 min), volta 403.
 */
export async function uploadItemImage(uploadUrl: string, file: File, signal?: AbortSignal) {
  let response: Response
  try {
    response = await fetch(uploadUrl, {
      method: "PUT",
      headers: file.type === "" ? undefined : { "Content-Type": file.type },
      body: file,
      signal,
    })
  } catch (error) {
    if (signal?.aborted === true) {
      throw error
    }
    throw new Error("Não foi possível enviar a imagem. Verifique sua conexão e tente novamente.", { cause: error })
  }

  if (!response.ok) {
    throw new Error(
      response.status === 403
        ? "O link de envio expirou (validade de 15 minutos). Tente enviar a imagem de novo."
        : "Não foi possível enviar a imagem."
    )
  }
}

/**
 * `POST /itens/:id/image/upload-url` — presigned PUT (15 min) para adicionar ou **substituir**
 * a foto de um item já cadastrado. Sem body.
 */
export async function requestItemImageUploadUrl(id: string): Promise<string> {
  const data = await request<{ uploadUrl: string }>(`/itens/${id}/image/upload-url`, { method: "POST" })
  return data.uploadUrl
}

/**
 * `POST /itens/:id/image/confirm` — chamar depois do `PUT` no R2. A API confere o arquivo no
 * bucket e marca `has_image`; `409` se ele não chegou. Idempotente. A resposta **não** traz
 * `image_url` — a foto nova aparece quando a listagem é recarregada.
 */
export function confirmItemImage(id: string) {
  return request<ItemDto>(`/itens/${id}/image/confirm`, { method: "POST" })
}

/**
 * Fluxo completo da foto do item: `upload-url` (se não vier uma URL pronta, como a do
 * `POST /itens`) → `PUT` no R2 → `confirm`. Sem o `confirm`, o item fica com
 * `has_image: false` mesmo com o arquivo no bucket. Repetir tudo é seguro: gera outra URL e
 * substitui o arquivo.
 */
export async function attachItemImage(id: string, file: File, uploadUrl?: string): Promise<ItemDto> {
  await uploadItemImage(uploadUrl ?? (await requestItemImageUploadUrl(id)), file)
  return confirmItemImage(id)
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
