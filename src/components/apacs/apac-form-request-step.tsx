import {
  APAC_PRIORITY_LABEL,
  APAC_PRIORITY_LIST,
  APAC_PROCEDURE_LABEL,
  APAC_PROCEDURE_LIST,
  type ApacPriority,
  type ApacProcedure,
} from "@/lib/apac"
import type { ApacFormValues } from "@/lib/apac-form"
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function ApacFormRequestStep({
  values,
  errors,
  onChange,
}: {
  values: ApacFormValues
  errors: Set<string>
  onChange: (partial: Partial<ApacFormValues>) => void
}) {
  return (
    <FieldGroup>
      <Field data-invalid={errors.has("procedure")}>
        <FieldLabel htmlFor="solicitacao-procedimento">Tipo de procedimento *</FieldLabel>
        <Select
          value={values.procedure || null}
          onValueChange={(procedure: string | null) => onChange({ procedure: (procedure ?? "") as ApacProcedure })}
        >
          <SelectTrigger id="solicitacao-procedimento" className="w-full" aria-invalid={errors.has("procedure")}>
            <SelectValue placeholder="Selecione o tipo">
              {(procedure: string | null) =>
                procedure ? APAC_PROCEDURE_LABEL[procedure as ApacProcedure] : "Selecione o tipo"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {APAC_PROCEDURE_LIST.map((procedure) => (
                <SelectItem key={procedure} value={procedure}>
                  {APAC_PROCEDURE_LABEL[procedure]}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {/* O contrato só aceita EXAME|CIRURGIA — não há código SIGTAP nem CID no modelo. */}
        <FieldDescription>A API aceita apenas exame ou cirurgia.</FieldDescription>
      </Field>

      <FieldSet>
        <FieldLegend variant="label">Prioridade *</FieldLegend>
        <RadioGroup
          className="grid-cols-2"
          value={values.priority}
          onValueChange={(priority) => onChange({ priority: priority as ApacPriority })}
        >
          {APAC_PRIORITY_LIST.map((priority) => (
            <FieldLabel key={priority} htmlFor={`prioridade-${priority}`}>
              <Field orientation="horizontal">
                <RadioGroupItem id={`prioridade-${priority}`} value={priority} />
                {APAC_PRIORITY_LABEL[priority]}
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
      </FieldSet>
    </FieldGroup>
  )
}
