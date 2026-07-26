/**
 * Modelo do formulário de cadastro de APAC.
 *
 * Só `name`, `cns`, `procedure` e `priority` existem hoje no `ApacCreateDto`
 * (ver `.docs/api-backend.md`); os demais campos vêm do mockup e precisam ser
 * acordados com o backend antes da integração.
 */
import type { ApacPriority } from "@/lib/apac"

export type ApacDocumentKey = "laudo" | "exames" | "solicitacao" | "outros"

export type ApacFormValues = {
  name: string
  cns: string
  cpf: string
  birthDate: string
  municipality: string
  phone: string
  procedureCode: string
  cid: string
  doctor: string
  unit: string
  requestedAt: string
  priority: ApacPriority
  documents: Record<ApacDocumentKey, boolean>
}

export const INITIAL_APAC_FORM: ApacFormValues = {
  name: "",
  cns: "",
  cpf: "",
  birthDate: "",
  municipality: "",
  phone: "",
  procedureCode: "",
  cid: "",
  doctor: "",
  unit: "",
  requestedAt: "",
  priority: "NORMAL",
  documents: { laudo: false, exames: false, solicitacao: false, outros: false },
}

export const REQUIRED_DOCUMENTS: ApacDocumentKey[] = ["laudo", "exames", "solicitacao"]

const REQUIRED_BY_STEP: Record<number, (keyof ApacFormValues)[]> = {
  1: ["name", "cns", "cpf", "birthDate", "municipality"],
  2: ["procedureCode", "cid", "doctor", "unit", "requestedAt"],
}

/**
 * Chaves inválidas na etapa. Documentos usam o prefixo `doc:` para não colidir
 * com os campos de texto.
 */
export function getStepErrors(step: number, values: ApacFormValues): Set<string> {
  const errors = new Set<string>()

  for (const key of REQUIRED_BY_STEP[step] ?? []) {
    if (typeof values[key] === "string" && values[key].trim() === "") {
      errors.add(key)
    }
  }

  if (step === 3) {
    for (const key of REQUIRED_DOCUMENTS) {
      if (!values.documents[key]) {
        errors.add(`doc:${key}`)
      }
    }
  }

  return errors
}
