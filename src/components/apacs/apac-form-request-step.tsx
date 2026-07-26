import { DOCTORS, PROCEDURE_OPTIONS, UNITS } from "@/data/apacs-mock"
import { APAC_PRIORITY_LABEL, APAC_PRIORITY_LIST, type ApacPriority } from "@/lib/apac"
import type { ApacFormValues } from "@/lib/apac-form"
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
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
      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        <Field className="sm:col-span-2" data-invalid={errors.has("procedureCode")}>
          <FieldLabel htmlFor="solicitacao-procedimento">Procedimento *</FieldLabel>
          <Select
            value={values.procedureCode || null}
            onValueChange={(procedureCode: string | null) => onChange({ procedureCode: procedureCode ?? "" })}
          >
            <SelectTrigger id="solicitacao-procedimento" className="w-full" aria-invalid={errors.has("procedureCode")}>
              <SelectValue placeholder="Selecione o procedimento">
                {(code: string | null) => {
                  const option = PROCEDURE_OPTIONS.find((item) => item.code === code)
                  return option ? `${option.name} — ${option.code}` : "Selecione o procedimento"
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {PROCEDURE_OPTIONS.map((option) => (
                  <SelectItem key={option.code} value={option.code}>
                    {option.name} — {option.code}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field data-invalid={errors.has("cid")}>
          <FieldLabel htmlFor="solicitacao-cid">CID *</FieldLabel>
          <Input
            id="solicitacao-cid"
            placeholder="Ex.: N18.6"
            aria-invalid={errors.has("cid")}
            value={values.cid}
            onChange={(event) => onChange({ cid: event.target.value })}
          />
        </Field>

        <Field data-invalid={errors.has("requestedAt")}>
          <FieldLabel htmlFor="solicitacao-data">Data da solicitação *</FieldLabel>
          <Input
            id="solicitacao-data"
            type="date"
            aria-invalid={errors.has("requestedAt")}
            value={values.requestedAt}
            onChange={(event) => onChange({ requestedAt: event.target.value })}
          />
        </Field>

        <Field data-invalid={errors.has("doctor")}>
          <FieldLabel htmlFor="solicitacao-medico">Médico solicitante *</FieldLabel>
          <Select
            value={values.doctor || null}
            onValueChange={(doctor: string | null) => onChange({ doctor: doctor ?? "" })}
          >
            <SelectTrigger id="solicitacao-medico" className="w-full" aria-invalid={errors.has("doctor")}>
              <SelectValue placeholder="Selecione o médico" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {DOCTORS.map((doctor) => (
                  <SelectItem key={doctor} value={doctor}>
                    {doctor}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field data-invalid={errors.has("unit")}>
          <FieldLabel htmlFor="solicitacao-unidade">Unidade solicitante *</FieldLabel>
          <Select value={values.unit || null} onValueChange={(unit: string | null) => onChange({ unit: unit ?? "" })}>
            <SelectTrigger id="solicitacao-unidade" className="w-full" aria-invalid={errors.has("unit")}>
              <SelectValue placeholder="Selecione a unidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {UNITS.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>

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
