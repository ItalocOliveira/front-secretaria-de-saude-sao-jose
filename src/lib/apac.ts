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

/**
 * Catálogo fixo de procedimentos aceitos pela API — ela garante isso com um
 * enum interno (`EXAME`/`CIRURGIA` deixaram de ser os únicos valores, mas
 * continua sendo um enum, não texto livre). Lista grande demais para um
 * `Select` comum; nos formulários é um `Combobox` com busca.
 */
export const APAC_PROCEDURE_LIST = [
  "CONSULTA EM ALERGIA E IMUNOLOGIA - PEDIATRICA",
  "CONSULTA EM ODONTOLOGIA - CIRURGIA BUCO-MAXILO FACIAL",
  "CONSULTA EM CIRURGIA DE CABECA E PESCOCO",
  "OCI AVALIAÇÃO CARDIOLÓGICA",
  "CONSULTA EM DERMATOLOGIA - ADULTO",
  "CONSULTA EM ENDOCRINOLOGIA E METABOLOGIA",
  "CONSULTA EM GASTROENTEROLOGIA - GERAL",
  "CONSULTA EM GINECOLOGIA",
  "CONSULTA EM HEMATOLOGIA",
  "CONSULTA EM HEPATOLOGIA",
  "CONSULTA EM INFECTOLOGIA",
  "CONSULTA EM MASTOLOGIA - GERAL",
  "CONSULTA EM MASTOLOGIA - CIRURGIA",
  "CONSULTA EM NEFROLOGIA - PRE DIALITICO",
  "CONSULTA EM NEUROCIRURGIA ADULTO",
  "CONSULTA EM NEUROLOGIA - CLINICA",
  "CONSULTA EM PRE-NATAL DE ALTO RISCO",
  "OCI AVALIAÇÃO INICIAL EM OFTALMOLOGIA - A PARTIR DE 9 ANOS",
  "CONSULTA EM ONCOLOGIA CLINICA",
  "OCI - AVALIAÇÃO DIAGNÓSTICA EM ORTOPEDIA COM RECURSOS DE RADIOLOGIA",
  "CONSULTA EM OTORRINOLARINGOLOGIA",
  "OCI - AVALIAÇÃO INICIAL DIAGNÓSTICA DE DEFICIT AUDITIVO",
  "OCI - AVALIAÇÃO DIAGNÓSTICA DE NASORAFINGE E DE OROFARINGE",
  "CONSULTA EM CIRURGIA PLASTICA",
  "CONSULTA EM PNEUMOLOGIA",
  "CONSULTA EM PROCTOLOGIA",
  "CONSULTA EM PSIQUIATRIA",
  "CONSULTA EM REUMATOLOGIA",
  "CONSULTA EM UROLOGIA",
  "CONSULTA EM PEDIATRIA",
  "CONSULTA EM CARDIOLOGIA - PEDIATRIA",
  "CONSULTA EM DERMATOLOGIA - PEDIATRIA",
  "CONSULTA EM ENDOCRINOLOGIA E METABOLOGIA - PEDIATRIA",
  "CONSULTA EM GASTROENTEROLOGIA - PEDIATRIA",
  "CONSULTA EM GINECOLOGIA - PEDIATRIA",
  "CONSULTA EM HEMATOLOGIA - PEDIATRIA",
  "CONSULTA EM HEPATOLOGIA - PEDIATRIA",
  "CONSULTA EM NEFROLOGIA - PEDIATRIA",
  "CONSULTA EM NEUROCIRURGIA - PEDIATRIA",
  "CONSULTA EM NEUROLOGIA - PEDIATRIA",
  "OCI - AVALIAÇÃO INICIAL EM OFTALMOLOGIA - 0 A 8 ANOS",
  "CONSULTA EM ORTOPEDIA GERAL - PEDIATRIA",
  "CONSULTA EM OTORRINOLARINGOLOGIA PEDIATRICA",
  "CONSULTA EM PNEUMOLOGIA - PEDIATRIA",
  "CONSULTA EM PSIQUIATRIA - PEDIATRIA",
  "CONSULTA EM CARDIOLOGIA - CARDIOPATIA CONGENITA",
  "CONSULTA EM CIRURGIA PEDIATRICA",
] as const

export type ApacProcedure = (typeof APAC_PROCEDURE_LIST)[number]

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
