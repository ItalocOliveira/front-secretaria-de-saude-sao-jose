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

export const ITEM_TYPE = {
  EQUIPAMENTO: "EQUIPAMENTO",
  MEDICAMENTO: "MEDICAMENTO",
} as const

export type ItemType = (typeof ITEM_TYPE)[keyof typeof ITEM_TYPE]

export const ITEM_TYPE_LABEL: Record<ItemType, string> = {
  EQUIPAMENTO: "Equipamento",
  MEDICAMENTO: "Medicamento",
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
