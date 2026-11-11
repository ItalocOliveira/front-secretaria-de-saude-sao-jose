import { useState } from "react"
import { CheckIcon, FileTextIcon, XIcon } from "lucide-react"

import {
  DOCUMENT_DESTINATION_LABEL,
  DOCUMENT_DESTINATION_LIST,
  DOCUMENT_PDF_MIME,
  type DocumentDestination,
} from "@/lib/document"
import { formatFileSize } from "@/lib/utils"
import { useCreateDocument, useUploadDocumentPdf } from "@/hooks/use-documents"
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { MAX_NAME_LENGTH, MAX_TEXT_LENGTH } from "@/lib/field-limits"

const INITIAL_FORM = {
  name: "",
  note: "",
  destination: "" as DocumentDestination | "",
  otherDestination: "",
  pdfFile: null as File | null,
}

/**
 * Ofício já criado, mas o `PUT` pro R2 falhou (link expirado, rede caiu no meio do
 * envio...). Guarda só o necessário pra reenviar sem recriar o registro — não há
 * endpoint pra regerar a `uploadUrl` isoladamente.
 */
type PendingUpload = { uploadUrl: string; file: File; documentName: string }

export function DocumentFormCard({ ref }: { ref?: React.Ref<HTMLDivElement> }) {
  const [form, setForm] = useState(INITIAL_FORM)
  const [validating, setValidating] = useState(false)
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null)
  const {
    mutate: createDocument,
    isPending: creating,
    error: createError,
    reset: resetCreateMutation,
  } = useCreateDocument()
  const {
    mutate: uploadPdf,
    isPending: uploading,
    error: uploadError,
    reset: resetUploadMutation,
  } = useUploadDocumentPdf()

  const isPending = creating || uploading

  const patch = (partial: Partial<typeof INITIAL_FORM>) => setForm((current) => ({ ...current, ...partial }))

  // Derivado no render, sem `useEffect`.
  const isOutro = form.destination === "OUTRO"
  const nameMissing = form.name.trim() === ""
  const destinationMissing = form.destination === ""
  const otherDestinationMissing = isOutro && form.otherDestination.trim() === ""
  const isValid = !nameMissing && !destinationMissing && !otherDestinationMissing

  const reset = () => {
    setForm(INITIAL_FORM)
    setValidating(false)
    setPendingUpload(null)
    resetCreateMutation()
    resetUploadMutation()
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!isValid) {
      setValidating(true)
      toast.add({ title: "Campos obrigatórios", description: "Preencha os campos destacados para continuar." })
      return
    }

    createDocument(
      {
        name: form.name,
        note: form.note.trim() === "" ? undefined : form.note,
        destination: form.destination as DocumentDestination,
        other_destination: isOutro ? form.otherDestination : undefined,
      },
      {
        onSuccess: ({ document, uploadUrl }) => {
          if (form.pdfFile === null) {
            toast.add({ title: "Ofício cadastrado", description: `Protocolo ${document.protocolNumber} gerado.` })
            reset()
            return
          }

          uploadPdf(
            { uploadUrl, file: form.pdfFile },
            {
              onSuccess: () => {
                toast.add({
                  title: "Ofício cadastrado",
                  description: `Protocolo ${document.protocolNumber} gerado. PDF enviado.`,
                })
                reset()
              },
              // Ofício já existe — não recriar. Guarda o arquivo pra permitir só o reenvio do PUT.
              onError: () => setPendingUpload({ uploadUrl, file: form.pdfFile as File, documentName: document.name }),
            }
          )
        },
      }
    )
  }

  const retryUpload = () => {
    if (pendingUpload === null) return

    uploadPdf(
      { uploadUrl: pendingUpload.uploadUrl, file: pendingUpload.file },
      {
        onSuccess: () => {
          toast.add({
            title: "PDF enviado",
            description: `Documento de ${pendingUpload.documentName} enviado com sucesso.`,
          })
          reset()
        },
      }
    )
  }

  const dismissPendingUpload = () => {
    toast.add({
      title: "Ofício cadastrado sem o PDF",
      description: "Você pode anexar o documento depois, quando o reenvio estiver disponível.",
    })
    reset()
  }

  return (
    <Card ref={ref}>
      {pendingUpload === null ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-(--card-spacing)">
          <CardHeader>
            <CardTitle>Cadastro de novo ofício</CardTitle>
          </CardHeader>

          <CardContent>
            <FieldGroup>
              {createError === null ? null : (
                <Alert variant="destructive">
                  <AlertTitle>Não foi possível cadastrar o ofício</AlertTitle>
                  <AlertDescription>{createError.message}</AlertDescription>
                </Alert>
              )}

              <Field data-invalid={validating && nameMissing}>
                <FieldLabel htmlFor="oficio-nome">Nome</FieldLabel>
                <Input
                  id="oficio-nome"
                  maxLength={MAX_NAME_LENGTH}
                  required
                  disabled={isPending}
                  aria-invalid={validating && nameMissing}
                  value={form.name}
                  onChange={(event) => patch({ name: event.target.value })}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="oficio-observacao">Observação</FieldLabel>
                <Textarea
                  id="oficio-observacao"
                  maxLength={MAX_TEXT_LENGTH}
                  disabled={isPending}
                  value={form.note}
                  onChange={(event) => patch({ note: event.target.value })}
                />
                <FieldDescription>Opcional.</FieldDescription>
              </Field>

              <Field data-invalid={validating && destinationMissing}>
                <FieldLabel htmlFor="oficio-destino">Destino</FieldLabel>
                <Select
                  value={form.destination || null}
                  onValueChange={(destination: string | null) =>
                    patch({
                      destination: (destination ?? "") as DocumentDestination | "",
                      otherDestination: destination === "OUTRO" ? form.otherDestination : "",
                    })
                  }
                >
                  <SelectTrigger id="oficio-destino" className="w-full" disabled={isPending}>
                    <SelectValue placeholder="Selecione o destino">
                      {(destination: string | null) =>
                        destination
                          ? DOCUMENT_DESTINATION_LABEL[destination as DocumentDestination]
                          : "Selecione o destino"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {DOCUMENT_DESTINATION_LIST.map((destination) => (
                        <SelectItem key={destination} value={destination}>
                          {DOCUMENT_DESTINATION_LABEL[destination]}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              {isOutro ? (
                <Field data-invalid={validating && otherDestinationMissing}>
                  <FieldLabel htmlFor="oficio-outro-destino">Qual destino?</FieldLabel>
                  <Input
                    id="oficio-outro-destino"
                    maxLength={MAX_NAME_LENGTH}
                    required
                    disabled={isPending}
                    aria-invalid={validating && otherDestinationMissing}
                    value={form.otherDestination}
                    onChange={(event) => patch({ otherDestination: event.target.value })}
                  />
                </Field>
              ) : null}

              <Field>
                <FieldLabel htmlFor="oficio-pdf">Documento (PDF)</FieldLabel>
                {form.pdfFile === null ? (
                  <Input
                    id="oficio-pdf"
                    type="file"
                    accept={DOCUMENT_PDF_MIME}
                    disabled={isPending}
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null
                      if (file !== null && file.type !== DOCUMENT_PDF_MIME) {
                        toast.add({ title: "Arquivo inválido", description: "Selecione um arquivo PDF." })
                        event.target.value = ""
                        return
                      }
                      patch({ pdfFile: file })
                    }}
                  />
                ) : (
                  <Attachment>
                    <AttachmentMedia>
                      <FileTextIcon />
                    </AttachmentMedia>
                    <AttachmentContent>
                      <AttachmentTitle>{form.pdfFile.name}</AttachmentTitle>
                      <AttachmentDescription>{formatFileSize(form.pdfFile.size)}</AttachmentDescription>
                    </AttachmentContent>
                    <AttachmentActions>
                      <AttachmentAction
                        aria-label="Remover arquivo"
                        disabled={isPending}
                        onClick={() => patch({ pdfFile: null })}
                      >
                        <XIcon />
                      </AttachmentAction>
                    </AttachmentActions>
                  </Attachment>
                )}
                <FieldDescription>Opcional.</FieldDescription>
              </Field>
            </FieldGroup>
          </CardContent>

          <CardFooter className="justify-end gap-2">
            <Button type="button" variant="ghost" onClick={reset} disabled={isPending}>
              <XIcon data-icon="inline-start" />
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Spinner data-icon="inline-start" /> : <CheckIcon data-icon="inline-start" />}
              Cadastrar ofício
            </Button>
          </CardFooter>
        </form>
      ) : (
        <>
          <CardHeader>
            <CardTitle>Cadastro de novo ofício</CardTitle>
            <CardDescription>Ofício cadastrado — envio do PDF pendente</CardDescription>
          </CardHeader>

          <CardContent>
            <Alert variant="destructive">
              <AlertTitle>O envio do PDF falhou</AlertTitle>
              <AlertDescription>
                O ofício de {pendingUpload.documentName} já foi cadastrado — só o documento não foi salvo.{" "}
                {uploadError?.message ?? "Tente reenviar o arquivo."}
              </AlertDescription>
            </Alert>
          </CardContent>

          <CardFooter className="justify-end gap-2">
            <Button variant="ghost" onClick={dismissPendingUpload} disabled={uploading}>
              <XIcon data-icon="inline-start" />
              Continuar sem PDF
            </Button>
            <Button onClick={retryUpload} disabled={uploading}>
              {uploading ? <Spinner data-icon="inline-start" /> : <CheckIcon data-icon="inline-start" />}
              Tentar reenviar
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  )
}
