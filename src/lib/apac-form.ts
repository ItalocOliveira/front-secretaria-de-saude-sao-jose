/**
 * Modelo do formulário de cadastro de APAC.
 *
 * Espelha exatamente o `ApacCreateDto` de `.docs/api-backend.md` — nada além
 * disso. O mockup previa nº da APAC, código SIGTAP, CID, médico solicitante,
 * unidade e anexos; nenhum desses campos existe no modelo `Apac` do backend,
 * então foram removidos em vez de coletados e descartados em silêncio. Ver as
 * lacunas em `.docs/integracao-api.md`.
 */

import type { CreateApacPayload } from "@/api/apacs"
import { APAC_PRIORITY, type ApacAcs, type ApacPriority, type ApacProcedure } from "@/lib/apac"
import { onlyDigits } from "@/lib/utils"

export type ApacFormValues = {
  name: string
  cns: string
  cpf: string
  /** `yyyy-MM-dd`, como vem de `<input type="date">`. */
  birthDate: string
  municipality: string
  procedure: ApacProcedure | ""
  priority: ApacPriority
  /** ACS (Agente Comunitário de Saúde) responsável — obrigatório pela API. */
  acs: ApacAcs | ""
  /**
   * Nunca viaja no `POST /apacs` — a API devolve um `uploadUrl` separado e o
   * PDF é enviado depois, direto pro R2. Fica só em memória até o submit.
   */
  pdfFile: File | null
}

export const INITIAL_APAC_FORM: ApacFormValues = {
  name: "",
  cns: "",
  cpf: "",
  birthDate: "",
  municipality: "",
  procedure: "",
  priority: APAC_PRIORITY.ELETIVO,
  acs: "",
  pdfFile: null,
}

/** MIME aceito pelo bucket — a API salva o objeto como `apacs/<id>.pdf`. */
export const APAC_PDF_MIME = "application/pdf"

/** Campos de texto do formulário — exclui `pdfFile`, que não tem `.trim()`. */
type ApacFormTextField = Exclude<keyof ApacFormValues, "pdfFile">

/** Obrigatórios segundo a API. `priority` já nasce preenchida. */
const REQUIRED_BY_STEP: Record<number, ApacFormTextField[]> = {
  1: ["name", "cns"],
  2: ["procedure", "acs"],
}

/**
 * Limites da data de nascimento. O `<input type="date">` aceita anos de até 6
 * dígitos (ex.: `99999-03-22`) se nada o restringir — `min`/`max` limitam o
 * seletor e `isValidBirthDate` barra o que for digitado à mão.
 */
export const BIRTH_DATE_MIN = "1900-01-01"
export const BIRTH_DATE_MAX = "2030-12-31"

/**
 * Exige ano de 4 dígitos antes de comparar: com isso a comparação de string vale
 * (sem ela, `"10000-01-01" < "2030-12-31"` passaria).
 */
export function isValidBirthDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  return value >= BIRTH_DATE_MIN && value <= BIRTH_DATE_MAX
}

export function getStepErrors(step: number, values: ApacFormValues) {
  const errors = new Set<string>()

  for (const field of REQUIRED_BY_STEP[step] ?? []) {
    if (values[field].trim() === "") {
      errors.add(field)
    }
  }

  if (step === 1 && values.birthDate !== "" && !isValidBirthDate(values.birthDate)) {
    errors.add("birthDate")
  }

  return errors
}

/**
 * `<input type="date">` devolve `yyyy-MM-dd` sem fuso. Interpretar como UTC evita
 * que o horário local jogue a data de nascimento para o dia anterior.
 */
function toIsoDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

export function toCreateApacPayload(values: ApacFormValues): CreateApacPayload {
  const cpf = onlyDigits(values.cpf)
  const municipality = values.municipality.trim()

  return {
    name: values.name.trim(),
    cns: onlyDigits(values.cns),
    // `getStepErrors` garante o preenchimento antes de chegar aqui.
    procedure: values.procedure as ApacProcedure,
    priority: values.priority,
    acs: values.acs as ApacAcs,
    // Opcionais só viajam quando têm conteúdo.
    ...(values.birthDate === "" ? {} : { birth_date: toIsoDate(values.birthDate) }),
    ...(cpf === "" ? {} : { cpf }),
    ...(municipality === "" ? {} : { municipality }),
  }
}
