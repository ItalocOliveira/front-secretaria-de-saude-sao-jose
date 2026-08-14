import { useState } from "react"
import { CheckIcon } from "lucide-react"

import type { Document, UpdateDocumentPayload } from "@/api/documents"
import { DOCUMENT_STATUS_LABEL, DOCUMENT_STATUS_LIST, type DocumentStatus } from "@/lib/document"
import { useUpdateDocument } from "@/hooks/use-documents"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"

type FormValues = {
  name: string
  note: string
  status: DocumentStatus
}

function toFormValues(document: Document): FormValues {
  return {
    name: document.name,
    note: document.note ?? "",
    status: document.status,
  }
}

function diffPayload(document: Document, values: FormValues): UpdateDocumentPayload {
  const payload: UpdateDocumentPayload = {}

  if (values.name !== document.name) payload.name = values.name
  if (values.note !== (document.note ?? "")) payload.note = values.note
  if (values.status !== document.status) payload.status = values.status

  return payload
}

export function DocumentEditDialog({
  document,
  onOpenChange,
}: {
  document: Document | null
  onOpenChange: (open: boolean) => void
}) {
  const [values, setValues] = useState<FormValues | null>(null)
  const { mutate: updateDocument, isPending, error, reset } = useUpdateDocument()

  // Deriva do `document` recebido, mas permite o usuário digitar por cima — sem `useEffect`.
  const current = values ?? (document === null ? null : toFormValues(document))

  const close = () => {
    reset()
    setValues(null)
    onOpenChange(false)
  }

  const submit = () => {
    if (document === null || current === null) {
      return
    }

    const payload = diffPayload(document, current)
    if (Object.keys(payload).length === 0) {
      close()
      return
    }

    updateDocument(
      { id: document.id, payload },
      {
        onSuccess: () => {
          toast.add({ title: "Ofício atualizado", description: `O protocolo ${document.protocolNumber} foi salvo.` })
          close()
        },
      }
    )
  }

  return (
    <Dialog open={document !== null} onOpenChange={(open) => (open ? null : close())}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar ofício</DialogTitle>
          <DialogDescription>Só nome, observação e situação podem ser alterados por aqui.</DialogDescription>
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
              <FieldLabel htmlFor="editar-oficio-nome">Nome</FieldLabel>
              <Input
                id="editar-oficio-nome"
                value={current.name}
                onChange={(event) => setValues({ ...current, name: event.target.value })}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="editar-oficio-observacao">Observação</FieldLabel>
              <Textarea
                id="editar-oficio-observacao"
                value={current.note}
                onChange={(event) => setValues({ ...current, note: event.target.value })}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="editar-oficio-status">Situação</FieldLabel>
              <Select
                value={current.status}
                onValueChange={(status: string | null) =>
                  setValues({ ...current, status: (status ?? current.status) as DocumentStatus })
                }
              >
                <SelectTrigger id="editar-oficio-status" className="w-full">
                  <SelectValue placeholder="Selecione a situação">
                    {(status: string | null) =>
                      status ? DOCUMENT_STATUS_LABEL[status as DocumentStatus] : "Selecione a situação"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {DOCUMENT_STATUS_LIST.map((status) => (
                      <SelectItem key={status} value={status}>
                        {DOCUMENT_STATUS_LABEL[status]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
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
