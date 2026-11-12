import { useEffect, useMemo, useState } from "react"
import { PlusIcon, XIcon } from "lucide-react"

import { ITEM_IMAGE_MIME_ACCEPT, ITEM_TYPE_LABEL, ITEM_TYPE_LIST, isImageFile, type ItemType } from "@/lib/itens"
import { useCreateItem, useUploadItemImage } from "@/hooks/use-itens"
import { formatFileSize } from "@/lib/utils"
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { MAX_ITEM_AMOUNT, MAX_NAME_LENGTH, MAX_TEXT_LENGTH, parseItemAmount } from "@/lib/field-limits"

const INITIAL_FORM = {
  name: "",
  description: "",
  type: null as ItemType | null,
  amount: "",
  minAmount: "",
  imageFile: null as File | null,
}

/** Produto já criado, mas o `PUT` da foto pro R2 falhou — guarda o necessário pra reenviar sem recriar o registro. */
type PendingUpload = { uploadUrl: string; file: File; itemName: string }

/**
 * Cadastro de produto no catálogo. A quantidade inicial é opcional: vazia/`0`
 * cria o produto sem estoque e sem movimento; `> 0` faz a API registrar uma
 * `ENTRADA` "Estoque inicial" no histórico, em nome de quem cadastrou. Depois
 * disso, o estoque só muda por entrada/saída (`ItemDetailsDialog`).
 */
export function ItemCreateDialog() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null)
  const { mutate: createItem, isPending: creating, error: createError, reset: resetCreate } = useCreateItem()
  const { mutate: uploadImage, isPending: uploading, error: uploadError, reset: resetUpload } = useUploadItemImage()

  const isPending = creating || uploading

  const previewUrl = useMemo(
    () => (form.imageFile === null ? null : URL.createObjectURL(form.imageFile)),
    [form.imageFile]
  )
  useEffect(() => {
    return () => {
      if (previewUrl !== null) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const patch = (partial: Partial<typeof INITIAL_FORM>) => setForm((current) => ({ ...current, ...partial }))

  const close = () => {
    resetCreate()
    resetUpload()
    setForm(INITIAL_FORM)
    setPendingUpload(null)
    setOpen(false)
  }

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const amount = form.amount.trim() === "" ? 0 : parseItemAmount(form.amount, 0)
    const minAmount = form.minAmount.trim() === "" ? 0 : parseItemAmount(form.minAmount, 0)
    if (form.type === null || amount === null || minAmount === null) {
      return
    }

    createItem(
      {
        name: form.name,
        description: form.description === "" ? undefined : form.description,
        type: form.type,
        amount,
        min_amount: minAmount,
      },
      {
        onSuccess: ({ item, uploadUrl }) => {
          if (form.imageFile === null) {
            toast.add({ title: "Produto cadastrado", description: `${item.name} foi adicionado ao almoxarifado.` })
            close()
            return
          }

          uploadImage(
            { uploadUrl, file: form.imageFile },
            {
              onSuccess: () => {
                toast.add({
                  title: "Produto cadastrado",
                  description: `${item.name} foi adicionado ao almoxarifado. Foto enviada.`,
                })
                close()
              },
              // O produto já existe — não recriar. Guarda o arquivo pra permitir só o reenvio do PUT.
              onError: () => setPendingUpload({ uploadUrl, file: form.imageFile as File, itemName: item.name }),
            }
          )
        },
      }
    )
  }

  const retryUpload = () => {
    if (pendingUpload === null) return

    uploadImage(
      { uploadUrl: pendingUpload.uploadUrl, file: pendingUpload.file },
      {
        onSuccess: () => {
          toast.add({ title: "Foto enviada", description: `Foto de ${pendingUpload.itemName} enviada com sucesso.` })
          close()
        },
      }
    )
  }

  const dismissPendingUpload = () => {
    toast.add({
      title: "Produto cadastrado sem foto",
      description: "Você pode anexar a foto depois, quando o reenvio estiver disponível.",
    })
    close()
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
      <DialogTrigger
        render={
          <Button>
            <PlusIcon data-icon="inline-start" />
            Novo produto
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        {pendingUpload === null ? (
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>Novo produto</DialogTitle>
              <DialogDescription>
                Cadastra o produto no almoxarifado. Informe a quantidade inicial ou lance uma entrada depois, nos
                detalhes do produto.
              </DialogDescription>
            </DialogHeader>

            <FieldGroup className="py-4">
              {createError === null ? null : (
                <Alert variant="destructive">
                  <AlertTitle>Não foi possível cadastrar o produto</AlertTitle>
                  <AlertDescription>{createError.message}</AlertDescription>
                </Alert>
              )}

              <Field>
                <FieldLabel htmlFor="item-nome">Nome</FieldLabel>
                <Input
                  id="item-nome"
                  maxLength={MAX_NAME_LENGTH}
                  required
                  disabled={isPending}
                  value={form.name}
                  onChange={(event) => patch({ name: event.target.value })}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="item-tipo">Tipo</FieldLabel>
                <Select
                  value={form.type}
                  onValueChange={(type: string | null) => patch({ type: type as ItemType | null })}
                >
                  <SelectTrigger id="item-tipo" className="w-full" disabled={isPending}>
                    <SelectValue placeholder="Selecione o tipo">
                      {(type: string | null) => (type ? ITEM_TYPE_LABEL[type as ItemType] : "Selecione o tipo")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {ITEM_TYPE_LIST.map((type) => (
                        <SelectItem key={type} value={type}>
                          {ITEM_TYPE_LABEL[type]}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="item-quantidade">Quantidade inicial</FieldLabel>
                <Input
                  id="item-quantidade"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={MAX_ITEM_AMOUNT}
                  step={1}
                  placeholder="0"
                  disabled={isPending}
                  value={form.amount}
                  onChange={(event) => patch({ amount: event.target.value })}
                />
                <FieldDescription>
                  Opcional. Número inteiro; se maior que zero, entra no extrato como estoque inicial em seu nome.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="item-quantidade-minima">Quantidade mínima</FieldLabel>
                <Input
                  id="item-quantidade-minima"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={MAX_ITEM_AMOUNT}
                  step={1}
                  placeholder="0"
                  disabled={isPending}
                  value={form.minAmount}
                  onChange={(event) => patch({ minAmount: event.target.value })}
                />
                <FieldDescription>
                  Opcional. Com o estoque abaixo deste número, o produto aparece nas notificações. Zero ou vazio desliga
                  o alerta.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="item-descricao">Descrição</FieldLabel>
                <Textarea
                  id="item-descricao"
                  maxLength={MAX_TEXT_LENGTH}
                  disabled={isPending}
                  value={form.description}
                  onChange={(event) => patch({ description: event.target.value })}
                />
                <FieldDescription>Opcional.</FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="item-foto">Foto</FieldLabel>
                {form.imageFile === null ? (
                  <Input
                    id="item-foto"
                    type="file"
                    accept={ITEM_IMAGE_MIME_ACCEPT}
                    disabled={isPending}
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null
                      if (file !== null && !isImageFile(file)) {
                        toast.add({ title: "Arquivo inválido", description: "Selecione uma imagem." })
                        event.target.value = ""
                        return
                      }
                      patch({ imageFile: file })
                    }}
                  />
                ) : (
                  <Attachment>
                    <AttachmentMedia variant="image">
                      {previewUrl === null ? null : <img src={previewUrl} alt="" />}
                    </AttachmentMedia>
                    <AttachmentContent>
                      <AttachmentTitle>{form.imageFile.name}</AttachmentTitle>
                      <AttachmentDescription>{formatFileSize(form.imageFile.size)}</AttachmentDescription>
                    </AttachmentContent>
                    <AttachmentActions>
                      <AttachmentAction
                        aria-label="Remover foto"
                        disabled={isPending}
                        onClick={() => patch({ imageFile: null })}
                      >
                        <XIcon />
                      </AttachmentAction>
                    </AttachmentActions>
                  </Attachment>
                )}
                <FieldDescription>
                  Opcional. Enviada direto para o armazenamento depois que o produto for cadastrado.
                </FieldDescription>
              </Field>
            </FieldGroup>

            <DialogFooter>
              <DialogClose
                render={
                  <Button type="button" variant="outline" onClick={close} disabled={isPending}>
                    Cancelar
                  </Button>
                }
              />
              <Button type="submit" disabled={isPending}>
                {isPending ? <Spinner data-icon="inline-start" /> : <PlusIcon data-icon="inline-start" />}
                Cadastrar
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Produto cadastrado — envio da foto pendente</DialogTitle>
              <DialogDescription className="sr-only">
                O envio da foto falhou, mas o produto já foi cadastrado.
              </DialogDescription>
            </DialogHeader>

            <Alert variant="destructive">
              <AlertTitle>O envio da foto falhou</AlertTitle>
              <AlertDescription>
                {pendingUpload.itemName} já foi cadastrado no almoxarifado — só a foto não foi salva.{" "}
                {uploadError?.message ?? "Tente reenviar o arquivo."}
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button variant="ghost" onClick={dismissPendingUpload} disabled={uploading}>
                <XIcon data-icon="inline-start" />
                Continuar sem foto
              </Button>
              <Button onClick={retryUpload} disabled={uploading}>
                {uploading ? <Spinner data-icon="inline-start" /> : <PlusIcon data-icon="inline-start" />}
                Tentar reenviar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
