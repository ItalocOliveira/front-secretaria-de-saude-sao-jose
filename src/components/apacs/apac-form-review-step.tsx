import { CircleAlertIcon } from "lucide-react"

import { APAC_PRIORITY_LABEL, APAC_PROCEDURE_LABEL, APAC_STATUS_LABEL, type ApacProcedure } from "@/lib/apac"
import type { ApacFormValues } from "@/lib/apac-form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"

const NOT_PROVIDED = "Não informado"

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Item variant="muted" size="sm">
      <ItemContent>
        <ItemDescription>{label}</ItemDescription>
        <ItemTitle>{value}</ItemTitle>
      </ItemContent>
    </Item>
  )
}

export function ApacFormReviewStep({ values }: { values: ApacFormValues }) {
  return (
    <div className="flex flex-col gap-4">
      <Alert>
        <CircleAlertIcon />
        <AlertTitle>Confira antes de enviar</AlertTitle>
        <AlertDescription>
          A APAC será criada com status {APAC_STATUS_LABEL.PENDENTE.toLowerCase()} — o status inicial é definido pela
          API e não pode ser escolhido aqui.
        </AlertDescription>
      </Alert>

      <ItemGroup className="grid gap-2 sm:grid-cols-2">
        <ReviewRow label="Paciente" value={values.name || NOT_PROVIDED} />
        <ReviewRow label="CNS" value={values.cns || NOT_PROVIDED} />
        <ReviewRow label="CPF" value={values.cpf || NOT_PROVIDED} />
        <ReviewRow label="Data de nascimento" value={values.birthDate || NOT_PROVIDED} />
        <ReviewRow label="Município" value={values.municipality || NOT_PROVIDED} />
        <ReviewRow
          label="Procedimento"
          value={
            values.procedure === "" ? (
              NOT_PROVIDED
            ) : (
              <Badge variant="secondary">{APAC_PROCEDURE_LABEL[values.procedure as ApacProcedure]}</Badge>
            )
          }
        />
        <ReviewRow
          label="Prioridade"
          value={
            <Badge variant={values.priority === "URGENTE" ? "destructive" : "outline"}>
              {APAC_PRIORITY_LABEL[values.priority]}
            </Badge>
          }
        />
      </ItemGroup>
    </div>
  )
}
