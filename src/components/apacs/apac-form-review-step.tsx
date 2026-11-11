import { CircleAlertIcon, FileTextIcon, XIcon } from "lucide-react"

import {
  APAC_ACS_LABEL,
  APAC_PRIORITY_LABEL,
  APAC_PROCEDURE_LABEL,
  APAC_STATUS_LABEL,
  type ApacAcs,
  type ApacProcedure,
} from "@/lib/apac"
import { APAC_PDF_MIME, type ApacFormValues } from "@/lib/apac-form"
import { formatCpf, formatFileSize } from "@/lib/utils"
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
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/toast"

const NOT_PROVIDED = "Não informado"

/** Bloco do resumo com atalho "Editar": corrige um dado sem voltar etapa por etapa. */
function ReviewSection({
  title,
  rows,
  disabled,
  onEdit,
}: {
  title: string
  rows: { label: string; value: React.ReactNode }[]
  disabled: boolean
  onEdit: () => void
}) {
  return (
    <section className="rounded-xl border">
      <div className="flex items-center justify-between border-b py-2 pr-2 pl-4">
        <h3 className="text-[0.9375rem] font-semibold">{title}</h3>
        <Button variant="link" size="sm" disabled={disabled} onClick={onEdit}>
          Editar
        </Button>
      </div>
      <dl className="grid gap-x-4 gap-y-2 px-4 py-3 text-sm sm:grid-cols-[10.5rem_1fr]">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="mb-2 font-medium sm:mb-0">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export function ApacFormReviewStep({
  values,
  disabled = false,
  onChange,
  onEditStep,
}: {
  values: ApacFormValues
  disabled?: boolean
  onChange: (partial: Partial<ApacFormValues>) => void
  onEditStep: (step: number) => void
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

      <ReviewSection
        title="Paciente"
        disabled={disabled}
        onEdit={() => onEditStep(1)}
        rows={[
          { label: "Nome", value: values.name || NOT_PROVIDED },
          { label: "CNS", value: values.cns || NOT_PROVIDED },
          { label: "CPF", value: values.cpf ? formatCpf(values.cpf) : NOT_PROVIDED },
          { label: "Data de nascimento", value: values.birthDate || NOT_PROVIDED },
          { label: "Município", value: values.municipality || NOT_PROVIDED },
        ]}
      />

      <ReviewSection
        title="Solicitação"
        disabled={disabled}
        onEdit={() => onEditStep(2)}
        rows={[
          {
            label: "Procedimento",
            value: values.procedure === "" ? NOT_PROVIDED : APAC_PROCEDURE_LABEL[values.procedure as ApacProcedure],
          },
          { label: "Prioridade", value: APAC_PRIORITY_LABEL[values.priority] },
          { label: "ACS responsável", value: values.acs === "" ? NOT_PROVIDED : APAC_ACS_LABEL[values.acs as ApacAcs] },
        ]}
      />

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
