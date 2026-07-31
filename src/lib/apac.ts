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

/** Texto livre — a API não valida mais contra um enum fixo (`EXAME`/`CIRURGIA` deixaram de ser os únicos valores). */
export type ApacProcedure = string

export const APAC_PRIORITY = {
  URGENTE: "URGENTE",
  NORMAL: "NORMAL",
} as const

export type ApacPriority = (typeof APAC_PRIORITY)[keyof typeof APAC_PRIORITY]

export const APAC_ACS = {
  MARLON: "MARLON",
  MARIA_JOSE_SILVA_RIBEIRO: "MARIA_JOSE_SILVA_RIBEIRO",
  MARIA_JOSE_DE_ARAUJO: "MARIA_JOSE_DE_ARAUJO",
  MARIA_DE_LOURDES: "MARIA_DE_LOURDES",
  MANOEL_BATISTA: "MANOEL_BATISTA",
  LEYDIANE_ARAUJO: "LEYDIANE_ARAUJO",
  KAIO_VICTOR: "KAIO_VICTOR",
  JOAO_MANOEL: "JOAO_MANOEL",
  ELANE_CRISTINA: "ELANE_CRISTINA",
  EDILEUZA_ALVES: "EDILEUZA_ALVES",
  ANA_EMILIA: "ANA_EMILIA",
  DEYSE: "DEYSE",
  JOELMA_FERNANDES: "JOELMA_FERNANDES",
  FLAVIO: "FLAVIO",
} as const

export type ApacAcs = (typeof APAC_ACS)[keyof typeof APAC_ACS]

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

export const APAC_PRIORITY_LABEL: Record<ApacPriority, string> = {
  URGENTE: "Urgente",
  NORMAL: "Normal",
}

/** Nome de exibição de cada ACS — o enum usa nome em `SCREAMING_SNAKE_CASE`. */
export const APAC_ACS_LABEL: Record<ApacAcs, string> = {
  MARLON: "Marlon",
  MARIA_JOSE_SILVA_RIBEIRO: "Maria José Silva Ribeiro",
  MARIA_JOSE_DE_ARAUJO: "Maria José de Araújo",
  MARIA_DE_LOURDES: "Maria de Lourdes",
  MANOEL_BATISTA: "Manoel Batista",
  LEYDIANE_ARAUJO: "Leydiane Araújo",
  KAIO_VICTOR: "Kaio Victor",
  JOAO_MANOEL: "João Manoel",
  ELANE_CRISTINA: "Elane Cristina",
  EDILEUZA_ALVES: "Edileuza Alves",
  ANA_EMILIA: "Ana Emília",
  DEYSE: "Deyse",
  JOELMA_FERNANDES: "Joelma Fernandes",
  FLAVIO: "Flávio",
}

export const USER_ROLE_LABEL: Record<UserRole, string> = {
  DEV: "Desenvolvedor",
  DIRETOR: "Diretor Geral",
  SECRETARIA: "Secretária de Saúde",
  RECEPCIONISTA: "Recepcionista",
  REGULADOR: "Regulador",
}

export const APAC_STATUS_LIST = Object.values(APAC_STATUS)
export const APAC_PRIORITY_LIST = Object.values(APAC_PRIORITY)
export const APAC_ACS_LIST = Object.values(APAC_ACS)
export const USER_ROLE_LIST = Object.values(USER_ROLE)

/** Iniciais para `AvatarFallback` — no máximo duas letras. */
export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  const first = parts.at(0)?.charAt(0) ?? ""
  const last = parts.length > 1 ? (parts.at(-1)?.charAt(0) ?? "") : ""

  return `${first}${last}`.toUpperCase()
}
