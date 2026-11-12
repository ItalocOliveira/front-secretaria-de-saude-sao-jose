import { useRef, useState, type ChangeEvent } from "react"
import { CheckIcon, ExternalLinkIcon, FileTextIcon, FileUpIcon } from "lucide-react"

import type { Apac, UpdateApacPayload } from "@/api/apacs"
import { MUNICIPALITIES } from "@/data/apacs-mock"
import {
  APAC_ACS_LABEL,
  APAC_ACS_LIST,
  APAC_STATUS_LABEL,
  APAC_STATUS_LIST,
  type ApacAcs,
  type ApacProcedure,
  type ApacStatus,
} from "@/lib/apac"
import { APAC_PDF_MIME } from "@/lib/apac-form"
import { useAttachApacPdf, useUpdateApac } from "@/hooks/use-apacs"
import { ApacProcedureCombobox } from "@/components/apacs/apac-procedure-combobox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Attachment,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/variants/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { MAX_NAME_LENGTH } from "@/lib/field-limits"

type FormValues = {
  name: string
  acs: ApacAcs
  procedure: ApacProcedure
  municipality: string
  status: ApacStatus
}

function toFormValues(apac: Apac): FormValues {
  return {
    name: apac.name,
    acs: apac.acs,
    procedure: apac.procedure,
    municipality: apac.municipality ?? "",
    status: apac.status,
  }
}

function diffPayload(apac: Apac, values: FormValues): UpdateApacPayload {
  const payload: UpdateApacPayload = {}

  if (values.name !== apac.name) payload.name = values.name
  if (values.acs !== apac.acs) payload.acs = values.acs
  if (values.procedure !== apac.procedure) payload.procedure = values.procedure
  if (values.municipality !== (apac.municipality ?? "")) payload.municipality = values.municipality
  if (values.status !== apac.status) payload.status = values.status

  return payload
}

export function ApacEditDialog({ apac, onOpenChange }: { apac: Apac | null; onOpenChange: (open: boolean) => void }) {
  const [values, setValues] = useState<FormValues | null>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const { mutate: updateApac, isPending: saving, error, reset } = useUpdateApac()
  const {
    mutate: attachPdf,
    isPending: uploadingPdf,
    error: pdfError,
    data: attachedApac,
    reset: resetAttachPdf,
  } = useAttachApacPdf()

  const isPending = saving || uploadingPdf

  // Deriva do `apac` recebido, mas permite o usuário digitar por cima — sem `useEffect`.
  const current = values ?? (apac === null ? null : toFormValues(apac))

  // O `apac` recebido é um retrato de quando o diálogo abriu; depois do `confirm`, vale a resposta dele.
  const pdfSource = attachedApac !== undefined && attachedApac.id === apac?.id ? attachedApac : apac
  const hasPdf = pdfSource?.hasPdf === true

  const close = () => {
    reset()
    resetAttachPdf()
    setValues(null)
    onOpenChange(false)
  }

  // O PDF é enviado assim que escolhido (`upload-url` → `PUT` no R2 → `confirm`), independente do "Salvar".
  const handlePdfChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    event.target.value = ""
    if (apac === null || file === null) {
      return
    }
    if (file.type !== APAC_PDF_MIME) {
      toast.add({ title: "Arquivo inválido", description: "Selecione um arquivo PDF." })
      return
    }

    const replacing = hasPdf
    attachPdf(
      { id: apac.id, file },
      {
        onSuccess: () =>
          toast.add({
            title: replacing ? "PDF substituído" : "PDF anexado",
            description: `Documento da APAC de ${apac.name} enviado com sucesso.`,
          }),
      }
    )
  }

  const submit = () => {
    if (apac === null || current === null) {
      return
    }

    const payload = diffPayload(apac, current)
    if (Object.keys(payload).length === 0) {
      close()
      return
    }

    updateApac(
      { id: apac.id, payload },
      {
        onSuccess: () => {
          toast.add({ title: "APAC atualizada", description: `Os dados de ${apac.name} foram salvos.` })
          close()
        },
      }
    )
  }

  return (
    <Dialog open={apac !== null} onOpenChange={(open) => (open ? null : close())}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar APAC</DialogTitle>
          <DialogDescription>
            Só nome, ACS, procedimento, município, situação e o PDF podem ser alterados por aqui.
          </DialogDescription>
        </DialogHeader>

        {current === null ? null : (
          <FieldGroup>
            {error === null ? null : (
              <Alert variant="destructive">
                <AlertTitle>Não foi possível salvar</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            )}

            <Field>
              <FieldLabel htmlFor="editar-nome">Nome completo</FieldLabel>
              <Input
                id="editar-nome"
                maxLength={MAX_NAME_LENGTH}
                autoComplete="name"
                value={current.name}
                onChange={(event) => setValues({ ...current, name: event.target.value })}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="editar-acs">ACS responsável</FieldLabel>
              <Select
                value={current.acs}
                onValueChange={(acs: string | null) => setValues({ ...current, acs: (acs ?? current.acs) as ApacAcs })}
              >
                <SelectTrigger id="editar-acs" className="w-full">
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
            </Field>

            <Field>
              <FieldLabel htmlFor="editar-procedimento">Tipo de procedimento</FieldLabel>
              <ApacProcedureCombobox
                id="editar-procedimento"
                value={current.procedure}
                onValueChange={(procedure) => setValues({ ...current, procedure: procedure ?? current.procedure })}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="editar-municipio">Município</FieldLabel>
              <Select
                value={current.municipality || null}
                onValueChange={(municipality: string | null) =>
                  setValues({ ...current, municipality: municipality ?? "" })
                }
              >
                <SelectTrigger id="editar-municipio" className="w-full">
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

            <Field>
              <FieldLabel htmlFor="editar-status">Situação</FieldLabel>
              <Select
                value={current.status}
                onValueChange={(status: string | null) =>
                  setValues({ ...current, status: (status ?? current.status) as ApacStatus })
                }
              >
                <SelectTrigger id="editar-status" className="w-full">
                  <SelectValue placeholder="Selecione a situação">
                    {(status: string | null) =>
                      status ? APAC_STATUS_LABEL[status as ApacStatus] : "Selecione a situação"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {APAC_STATUS_LIST.map((status) => (
                      <SelectItem key={status} value={status}>
                        {APAC_STATUS_LABEL[status]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field data-disabled={isPending || undefined}>
              <FieldLabel htmlFor="editar-pdf">Documento (PDF)</FieldLabel>
              {pdfError === null ? null : (
                <Alert variant="destructive">
                  <AlertTitle>Não foi possível enviar o PDF</AlertTitle>
                  <AlertDescription>{pdfError.message}</AlertDescription>
                </Alert>
              )}
              <Attachment className="w-full" state={uploadingPdf ? "uploading" : hasPdf ? "done" : "idle"}>
                <AttachmentMedia>{uploadingPdf ? <Spinner /> : <FileTextIcon />}</AttachmentMedia>
                <AttachmentContent>
                  <AttachmentTitle>
                    {uploadingPdf ? "Enviando PDF…" : hasPdf ? "PDF anexado" : "Sem PDF"}
                  </AttachmentTitle>
                  <AttachmentDescription>
                    {hasPdf ? "Enviar outro arquivo substitui o atual." : "Esta APAC ainda não tem documento."}
                  </AttachmentDescription>
                </AttachmentContent>
                <AttachmentActions className="gap-1">
                  {hasPdf && pdfSource?.pdfUrl ? (
                    <a
                      href={pdfSource.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-slot="button"
                      className={buttonVariants({ variant: "ghost", size: "sm" })}
                    >
                      <ExternalLinkIcon data-icon="inline-start" />
                      Ver
                    </a>
                  ) : null}
                  <Button variant="outline" size="sm" disabled={isPending} onClick={() => pdfInputRef.current?.click()}>
                    <FileUpIcon data-icon="inline-start" />
                    {hasPdf ? "Substituir PDF" : "Anexar PDF"}
                  </Button>
                </AttachmentActions>
              </Attachment>
              <input
                ref={pdfInputRef}
                id="editar-pdf"
                type="file"
                accept={APAC_PDF_MIME}
                className="sr-only"
                tabIndex={-1}
                disabled={isPending}
                onChange={handlePdfChange}
              />
              <FieldDescription>Enviado na hora, sem precisar clicar em Salvar.</FieldDescription>
            </Field>
          </FieldGroup>
        )}

        <DialogFooter>
          <DialogClose
            render={
              <Button variant="outline" onClick={close} disabled={isPending}>
                Cancelar
              </Button>
            }
          />
          <Button onClick={submit} disabled={isPending}>
            {isPending ? <Spinner data-icon="inline-start" /> : <CheckIcon data-icon="inline-start" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
