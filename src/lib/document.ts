/**
 * Domínio de Documents (Ofícios) — espelha os enums do contrato em `.docs/api-backend.md`.
 *
 * `erasableSyntaxOnly` proíbe `enum`, então os valores vivem em `const objects`
 * e os tipos são derivados deles.
 */

export const DOCUMENT_DESTINATION = {
  COMPRAS: "COMPRAS",
  EDUCACAO: "EDUCACAO",
  FINANCAS: "FINANCAS",
  RH: "RH",
  CAMARA_DOS_VEREADORES: "CAMARA_DOS_VEREADORES",
  PROMOTORIA: "PROMOTORIA",
  OUTRO: "OUTRO",
} as const

export type DocumentDestination = (typeof DOCUMENT_DESTINATION)[keyof typeof DOCUMENT_DESTINATION]

export const DOCUMENT_STATUS = {
  SOLICITADO: "SOLICITADO",
  ATENDIDO: "ATENDIDO",
  NEGADO: "NEGADO",
  FINALIZADO: "FINALIZADO",
} as const

export type DocumentStatus = (typeof DOCUMENT_STATUS)[keyof typeof DOCUMENT_STATUS]

export const DOCUMENT_DESTINATION_LABEL: Record<DocumentDestination, string> = {
  COMPRAS: "Compras",
  EDUCACAO: "Educação",
  FINANCAS: "Finanças",
  RH: "RH",
  CAMARA_DOS_VEREADORES: "Câmara dos Vereadores",
  PROMOTORIA: "Promotoria",
  OUTRO: "Outro",
}

export const DOCUMENT_STATUS_LABEL: Record<DocumentStatus, string> = {
  SOLICITADO: "Solicitado",
  ATENDIDO: "Atendido",
  NEGADO: "Negado",
  FINALIZADO: "Finalizado",
}

/** Variante de `Badge` usada para cada status — só tokens semânticos. */
export const DOCUMENT_STATUS_BADGE: Record<DocumentStatus, "default" | "secondary" | "destructive" | "outline"> = {
  SOLICITADO: "outline",
  ATENDIDO: "secondary",
  NEGADO: "destructive",
  FINALIZADO: "default",
}

export const DOCUMENT_DESTINATION_LIST = Object.values(DOCUMENT_DESTINATION)
export const DOCUMENT_STATUS_LIST = Object.values(DOCUMENT_STATUS)

/** MIME aceito pelo bucket — a API salva o objeto do ofício como PDF. */
export const DOCUMENT_PDF_MIME = "application/pdf"
