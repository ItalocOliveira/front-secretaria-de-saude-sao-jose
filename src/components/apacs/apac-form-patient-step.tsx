import { MUNICIPALITIES } from "@/data/apacs-mock"
import type { ApacFormValues } from "@/lib/apac-form"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function ApacFormPatientStep({
  values,
  errors,
  onChange,
}: {
  values: ApacFormValues
  errors: Set<string>
  onChange: (partial: Partial<ApacFormValues>) => void
}) {
  return (
    <FieldGroup className="grid gap-4 sm:grid-cols-2">
      <Field className="sm:col-span-2" data-invalid={errors.has("name")}>
        <FieldLabel htmlFor="paciente-nome">Nome completo *</FieldLabel>
        <Input
          id="paciente-nome"
          autoComplete="name"
          placeholder="Digite o nome do paciente"
          aria-invalid={errors.has("name")}
          value={values.name}
          onChange={(event) => onChange({ name: event.target.value })}
        />
      </Field>

      <Field data-invalid={errors.has("cns")}>
        <FieldLabel htmlFor="paciente-cns">CNS *</FieldLabel>
        <Input
          id="paciente-cns"
          inputMode="numeric"
          placeholder="000000000000000"
          aria-invalid={errors.has("cns")}
          value={values.cns}
          onChange={(event) => onChange({ cns: event.target.value })}
        />
        <FieldDescription>Somente números.</FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="paciente-cpf">CPF</FieldLabel>
        <Input
          id="paciente-cpf"
          inputMode="numeric"
          placeholder="00000000000"
          value={values.cpf}
          onChange={(event) => onChange({ cpf: event.target.value })}
        />
        <FieldDescription>Opcional no cadastro.</FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="paciente-nascimento">Data de nascimento</FieldLabel>
        <Input
          id="paciente-nascimento"
          type="date"
          value={values.birthDate}
          onChange={(event) => onChange({ birthDate: event.target.value })}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="paciente-municipio">Município</FieldLabel>
        <Select
          value={values.municipality || null}
          onValueChange={(municipality: string | null) => onChange({ municipality: municipality ?? "" })}
        >
          <SelectTrigger id="paciente-municipio" className="w-full">
            <SelectValue placeholder="Selecione o município" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {MUNICIPALITIES.map((municipality) => (
                <SelectItem key={municipality} value={municipality}>
                  {municipality}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
    </FieldGroup>
  )
}
