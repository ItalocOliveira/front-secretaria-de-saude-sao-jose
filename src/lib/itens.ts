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
