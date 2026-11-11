import { SignalHighIcon, SignalLowIcon } from "lucide-react"

import {
  APAC_ACS_LABEL,
  APAC_ACS_LIST,
  APAC_PRIORITY_LABEL,
  APAC_PRIORITY_LIST,
  type ApacAcs,
  type ApacPriority,
} from "@/lib/apac"
import type { ApacFormValues } from "@/lib/apac-form"
import { ApacProcedureCombobox } from "@/components/apacs/apac-procedure-combobox"
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

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
        <FieldLabel htmlFor="solicitacao-procedimento">
          Tipo de procedimento <span className="text-destructive">*</span>
        </FieldLabel>
        <ApacProcedureCombobox
          id="solicitacao-procedimento"
          value={values.procedure}
          invalid={errors.has("procedure")}
          onValueChange={(procedure) => onChange({ procedure: procedure ?? "" })}
        />
      </Field>

      <Field data-invalid={errors.has("acs")}>
        <FieldLabel htmlFor="solicitacao-acs">
          ACS responsável <span className="text-destructive">*</span>
        </FieldLabel>
        <Select
          value={values.acs || null}
          onValueChange={(acs: string | null) => onChange({ acs: (acs ?? "") as ApacAcs })}
        >
          <SelectTrigger id="solicitacao-acs" className="w-full" aria-invalid={errors.has("acs")}>
            <SelectValue placeholder="Selecione o ACS">
              {(acs: string | null) => (acs ? APAC_ACS_LABEL[acs as ApacAcs] : "Selecione o ACS")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {APAC_ACS_LIST.map((acs) => (
                <SelectItem key={acs} value={acs}>
                  {APAC_ACS_LABEL[acs]}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <FieldDescription>Agente Comunitário de Saúde responsável pelo paciente.</FieldDescription>
      </Field>

      <FieldSet>
        <FieldLegend variant="label">
          Prioridade <span className="text-destructive">*</span>
        </FieldLegend>
        {/* Só duas opções: lado a lado é mais rápido que abrir uma lista. */}
        <ToggleGroup
          variant="outline"
          spacing={2}
          className="grid w-full grid-cols-2"
          value={[values.priority]}
          onValueChange={(next: string[]) => {
            const priority = next.at(0)
            if (priority) {
              onChange({ priority: priority as ApacPriority })
            }
          }}
        >
          {APAC_PRIORITY_LIST.map((priority) => {
            const Icon = priority === "URGENTE" ? SignalHighIcon : SignalLowIcon
            return (
              <ToggleGroupItem
                key={priority}
                value={priority}
                className="h-11 gap-2 aria-pressed:border-primary aria-pressed:bg-primary/15 aria-pressed:font-semibold aria-pressed:text-foreground"
              >
                <Icon />
                {APAC_PRIORITY_LABEL[priority]}
              </ToggleGroupItem>
            )
          })}
        </ToggleGroup>
      </FieldSet>
    </FieldGroup>
  )
}
