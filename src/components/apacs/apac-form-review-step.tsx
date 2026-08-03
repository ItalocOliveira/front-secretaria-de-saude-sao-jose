import { CircleAlertIcon, FileTextIcon, XIcon } from "lucide-react"

import {
  APAC_ACS_LABEL,
  APAC_PRIORITY_LABEL,
  APAC_PROCEDURE_LABEL,
  APAC_STATUS_LABEL,
  type ApacAcs,
  type ApacProcedure,
} from "@/lib/apac"
import { APAC_PDF_MIME, formatFileSize, type ApacFormValues } from "@/lib/apac-form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment"
import { Badge } from "@/components/ui/badge"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import { toast } from "@/components/ui/toast"

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

export function ApacFormReviewStep({
  values,
  disabled = false,
  onChange,
}: {
  values: ApacFormValues
  disabled?: boolean
  onChange: (partial: Partial<ApacFormValues>) => void
}) {
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
        <ReviewRow
          label="ACS responsável"
          value={values.acs === "" ? NOT_PROVIDED : APAC_ACS_LABEL[values.acs as ApacAcs]}
        />
      </ItemGroup>

      <Field>
        <FieldLabel htmlFor="apac-documento-pdf">Documento (PDF)</FieldLabel>
        {values.pdfFile === null ? (
          <Input
            id="apac-documento-pdf"
            type="file"
            accept={APAC_PDF_MIME}
            disabled={disabled}
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null
              if (file !== null && file.type !== APAC_PDF_MIME) {
                toast.add({ title: "Arquivo inválido", description: "Selecione um arquivo PDF." })
                event.target.value = ""
                return
              }
              onChange({ pdfFile: file })
            }}
          />
        ) : (
          <Attachment>
            <AttachmentMedia>
              <FileTextIcon />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>{values.pdfFile.name}</AttachmentTitle>
              <AttachmentDescription>{formatFileSize(values.pdfFile.size)}</AttachmentDescription>
            </AttachmentContent>
            <AttachmentActions>
              <AttachmentAction
                aria-label="Remover arquivo"
                disabled={disabled}
                onClick={() => onChange({ pdfFile: null })}
              >
                <XIcon />
              </AttachmentAction>
            </AttachmentActions>
          </Attachment>
        )}
        <FieldDescription>
          Opcional. Enviado direto para o armazenamento depois que a APAC for cadastrada — não passa pelo backend.
        </FieldDescription>
      </Field>
    </div>
  )
}
