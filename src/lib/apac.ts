/**
 * Domínio de APACs — espelha os enums do contrato em `.docs/api-backend.md`.
 *
 * `erasableSyntaxOnly` proíbe `enum`, então os valores vivem em `const objects`
 * e os tipos são derivados deles.
 */

export const APAC_STATUS = {
  PENDENTE: "PENDENTE",
  AGUARDO: "AGUARDO",
  APROVADO: "APROVADO",
  CANCELADO: "CANCELADO",
  NEGADO: "NEGADO",
} as const

export type ApacStatus = (typeof APAC_STATUS)[keyof typeof APAC_STATUS]

export const APAC_PROCEDURE = {
  EXAME: "EXAME",
  CIRURGIA: "CIRURGIA",
} as const

export type ApacProcedure = (typeof APAC_PROCEDURE)[keyof typeof APAC_PROCEDURE]

export const APAC_PRIORITY = {
  URGENTE: "URGENTE",
  NORMAL: "NORMAL",
} as const

export type ApacPriority = (typeof APAC_PRIORITY)[keyof typeof APAC_PRIORITY]

export const USER_ROLE = {
  DEV: "DEV",
  DIRETOR: "DIRETOR",
  SECRETARIA: "SECRETARIA",
  RECEPCIONISTA: "RECEPCIONISTA",
  REGULADOR: "REGULADOR",
} as const

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE]

export const APAC_STATUS_LABEL: Record<ApacStatus, string> = {
  PENDENTE: "Pendente",
  AGUARDO: "Em análise",
  APROVADO: "Aprovada",
  CANCELADO: "Cancelada",
  NEGADO: "Negada",
}

/** Variante de `Badge` usada para cada status — só tokens semânticos. */
export const APAC_STATUS_BADGE: Record<ApacStatus, "default" | "secondary" | "destructive" | "outline"> = {
  PENDENTE: "outline",
  AGUARDO: "secondary",
  APROVADO: "default",
  CANCELADO: "outline",
  NEGADO: "destructive",
}

export const APAC_PROCEDURE_LABEL: Record<ApacProcedure, string> = {
  EXAME: "Exame",
  CIRURGIA: "Cirurgia",
}

export const APAC_PRIORITY_LABEL: Record<ApacPriority, string> = {
  URGENTE: "Urgente",
  NORMAL: "Normal",
}

export const USER_ROLE_LABEL: Record<UserRole, string> = {
  DEV: "Desenvolvedor",
  DIRETOR: "Diretor Geral",
  SECRETARIA: "Secretária de Saúde",
  RECEPCIONISTA: "Recepcionista",
  REGULADOR: "Regulador",
}

export const APAC_STATUS_LIST = Object.values(APAC_STATUS)
export const APAC_PROCEDURE_LIST = Object.values(APAC_PROCEDURE)
export const APAC_PRIORITY_LIST = Object.values(APAC_PRIORITY)
export const USER_ROLE_LIST = Object.values(USER_ROLE)

/** Iniciais para `AvatarFallback` — no máximo duas letras. */
export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  const first = parts.at(0)?.charAt(0) ?? ""
  const last = parts.length > 1 ? (parts.at(-1)?.charAt(0) ?? "") : ""

  return `${first}${last}`.toUpperCase()
}
