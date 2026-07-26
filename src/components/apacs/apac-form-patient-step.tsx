import { ScanLineIcon } from "lucide-react"

import { MUNICIPALITIES } from "@/data/apacs-mock"
import type { ApacFormValues } from "@/lib/apac-form"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/toast"

export function ApacFormPatientStep({
  values,
  errors,
  onChange,
}: {
  values: ApacFormValues
  errors: Set<string>
  onChange: (partial: Partial<ApacFormValues>) => void
}) {
  const startScan = () => {
    onChange({
      name: "Maria Aparecida Souza",
      cns: "700 0000 0000 0001",
      cpf: "000.000.000-00",
      birthDate: "1985-03-22",
      municipality: MUNICIPALITIES[0],
    })
    toast.add({
      title: "Documento lido",
      description: "Os dados do paciente foram preenchidos a partir do documento escaneado.",
    })
  }

  return (
    <FieldGroup>
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ScanLineIcon />
          </EmptyMedia>
          <EmptyTitle>Escanear documento</EmptyTitle>
          <EmptyDescription>Use a câmera para ler o RG, CNH ou CNS e preencher os campos abaixo.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" size="sm" onClick={startScan}>
            <ScanLineIcon data-icon="inline-start" />
            Iniciar escaneamento
          </Button>
        </EmptyContent>
      </Empty>

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
            placeholder="000 0000 0000 0000"
            aria-invalid={errors.has("cns")}
            value={values.cns}
            onChange={(event) => onChange({ cns: event.target.value })}
          />
        </Field>

        <Field data-invalid={errors.has("cpf")}>
          <FieldLabel htmlFor="paciente-cpf">CPF *</FieldLabel>
          <Input
            id="paciente-cpf"
            inputMode="numeric"
            placeholder="000.000.000-00"
            aria-invalid={errors.has("cpf")}
            value={values.cpf}
            onChange={(event) => onChange({ cpf: event.target.value })}
          />
        </Field>

        <Field data-invalid={errors.has("birthDate")}>
          <FieldLabel htmlFor="paciente-nascimento">Data de nascimento *</FieldLabel>
          <Input
            id="paciente-nascimento"
            type="date"
            aria-invalid={errors.has("birthDate")}
            value={values.birthDate}
            onChange={(event) => onChange({ birthDate: event.target.value })}
          />
        </Field>

        <Field data-invalid={errors.has("municipality")}>
          <FieldLabel htmlFor="paciente-municipio">Município *</FieldLabel>
          <Select
            value={values.municipality || null}
            onValueChange={(municipality: string | null) => onChange({ municipality: municipality ?? "" })}
          >
            <SelectTrigger id="paciente-municipio" className="w-full" aria-invalid={errors.has("municipality")}>
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

        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="paciente-telefone">Telefone</FieldLabel>
          <Input
            id="paciente-telefone"
            type="tel"
            placeholder="(00) 00000-0000"
            value={values.phone}
            onChange={(event) => onChange({ phone: event.target.value })}
          />
        </Field>
      </FieldGroup>
    </FieldGroup>
  )
}
