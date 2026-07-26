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
import { APAC_PRIORITY, type ApacPriority, type ApacProcedure } from "@/lib/apac"

export type ApacFormValues = {
  name: string
  cns: string
  cpf: string
  /** `yyyy-MM-dd`, como vem de `<input type="date">`. */
  birthDate: string
  municipality: string
  procedure: ApacProcedure | ""
  priority: ApacPriority
}

export const INITIAL_APAC_FORM: ApacFormValues = {
  name: "",
  cns: "",
  cpf: "",
  birthDate: "",
  municipality: "",
  procedure: "",
  priority: APAC_PRIORITY.NORMAL,
}

/** Obrigatórios segundo a API. `priority` já nasce preenchida. */
const REQUIRED_BY_STEP: Record<number, (keyof ApacFormValues)[]> = {
  1: ["name", "cns"],
  2: ["procedure"],
}

export function getStepErrors(step: number, values: ApacFormValues) {
  const errors = new Set<string>()

  for (const field of REQUIRED_BY_STEP[step] ?? []) {
    if (values[field].trim() === "") {
      errors.add(field)
    }
  }

  return errors
}

/** Só dígitos: a API grava CNS/CPF sem máscara. */
function onlyDigits(value: string) {
  return value.replaceAll(/\D/g, "")
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
    // Opcionais só viajam quando têm conteúdo.
    ...(values.birthDate === "" ? {} : { birth_date: toIsoDate(values.birthDate) }),
    ...(cpf === "" ? {} : { cpf }),
    ...(municipality === "" ? {} : { municipality }),
  }
}
