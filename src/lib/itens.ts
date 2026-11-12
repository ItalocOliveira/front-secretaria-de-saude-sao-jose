/**
 * Domínio de itens do almoxarifado — espelha o contrato de `/itens`.
 *
 * `erasableSyntaxOnly` proíbe `enum`, então os valores vivem em `const objects`
 * e os tipos são derivados deles (mesmo padrão de `src/lib/apac.ts`).
 */

export const ITEM_STATUS = {
  DISPONIVEL: "DISPONIVEL",
  EMPRESTADO: "EMPRESTADO",
} as const

export type ItemStatus = (typeof ITEM_STATUS)[keyof typeof ITEM_STATUS]

export const ITEM_STATUS_LABEL: Record<ItemStatus, string> = {
  DISPONIVEL: "Disponível",
  EMPRESTADO: "Emprestado",
}

/** Variante de `Badge` usada para cada status — só tokens semânticos. */
export const ITEM_STATUS_BADGE: Record<ItemStatus, "default" | "secondary" | "destructive" | "outline"> = {
  DISPONIVEL: "default",
  EMPRESTADO: "secondary",
}

export const ITEM_STATUS_LIST = Object.values(ITEM_STATUS)

/** Mesma regra do `GET /notifications`: `min_amount` `0` desliga o alerta. */
export function isLowStock(item: { amount: number; min_amount?: number | null }) {
  const min = item.min_amount ?? 0
  return min > 0 && item.amount < min
}

export const ITEM_TYPE = {
  MEDICAMENTO: "MEDICAMENTO",
  ODONTOLOGICO: "ODONTOLOGICO",
  LABORATORIAL: "LABORATORIAL",
  EXPEDIENTE: "EXPEDIENTE",
  INSUMO: "INSUMO",
  CONSUMO_GERAL: "CONSUMO_GERAL",
  MATERIAL_DE_LIMPEZA: "MATERIAL_DE_LIMPEZA",
  EQUIPAMENTO: "EQUIPAMENTO",
} as const

export type ItemType = (typeof ITEM_TYPE)[keyof typeof ITEM_TYPE]

export const ITEM_TYPE_LABEL: Record<ItemType, string> = {
  MEDICAMENTO: "Medicamento",
  ODONTOLOGICO: "Odontológico",
  LABORATORIAL: "Laboratorial",
  EXPEDIENTE: "Expediente",
  INSUMO: "Insumo",
  CONSUMO_GERAL: "Consumo geral",
  MATERIAL_DE_LIMPEZA: "Material de limpeza",
  EQUIPAMENTO: "Equipamento",
}

export const ITEM_TYPE_LIST = Object.values(ITEM_TYPE)

/** Movimento de estoque — lançado via `POST /itens/:id/movements` na tela de detalhe do produto. */
export const MOVEMENT_TYPE = {
  ENTRADA: "ENTRADA",
  SAIDA: "SAIDA",
} as const

export type MovementType = (typeof MOVEMENT_TYPE)[keyof typeof MOVEMENT_TYPE]

export const MOVEMENT_TYPE_LABEL: Record<MovementType, string> = {
  ENTRADA: "Entrada",
  SAIDA: "Saída",
}

/** Variante de `Badge` usada para cada movimento no extrato — só tokens semânticos. */
export const MOVEMENT_TYPE_BADGE: Record<MovementType, "default" | "secondary" | "destructive" | "outline"> = {
  ENTRADA: "default",
  SAIDA: "secondary",
}

export const MOVEMENT_TYPE_LIST = Object.values(MOVEMENT_TYPE)

/**
 * A API não restringe o `Content-Type` do upload — a chave no bucket é
 * `itens/<id>`, sem extensão. `accept` aqui é só UX (evitar que o usuário
 * escolha um arquivo que claramente não é foto).
 */
export const ITEM_IMAGE_MIME_ACCEPT = "image/*"

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/")
}

/** `location.state` aceito por `/almoxarifado` — o sino abre a listagem buscando o item e já mostra o detalhe. */
export type ItensLocationState = {
  search?: string
  itemId?: string
}

export function readItensLocationState(state: unknown): { search: string; itemId: string | null } {
  if (typeof state !== "object" || state === null) {
    return { search: "", itemId: null }
  }

  const { search, itemId } = state as Record<string, unknown>
  return { search: typeof search === "string" ? search : "", itemId: typeof itemId === "string" ? itemId : null }
}
