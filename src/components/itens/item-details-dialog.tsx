import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ArrowDownIcon, ArrowUpIcon, HistoryIcon, PencilIcon, RefreshCwIcon, Trash2Icon, XIcon } from "lucide-react"

import type { ItemDto } from "@/api/itens"
import {
  ITEM_IMAGE_MIME_ACCEPT,
  ITEM_STATUS_BADGE,
  ITEM_STATUS_LABEL,
  ITEM_TYPE_LABEL,
  isImageFile,
  MOVEMENT_TYPE_BADGE,
  MOVEMENT_TYPE_LABEL,
  type MovementType,
} from "@/lib/itens"
import { useCreateItemMovement, useUploadItemImage } from "@/hooks/use-itens"
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
import { Badge } from "@/components/ui/badge"
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
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { ImageLightbox } from "@/components/ui/image-lightbox"
import { Input } from "@/components/ui/input"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { MAX_NAME_LENGTH } from "@/lib/field-limits"

const MOVEMENT_FORM_ID = "item-movement-form"

function formatDateTime(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "—" : format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

/** Produto do bucket. Foto comprovante já criada, mas o `PUT` pro R2 falhou — guarda o necessário pra reenviar sem recriar o movimento. */
type PendingMovementUpload = { uploadUrl: string; file: File; movementLabel: string }

/**
 * Parte C: saldo + extrato. Ao clicar em Entrada/Saída, o extrato dá lugar
 * temporariamente a um mini-formulário de quantidade — em vez de abrir um
 * dialog/sheet separado por cima.
 */
export function ItemDetailsDialog({
  item,
  onOpenChange,
  onEdit,
  onDelete,
  onRefresh,
  isRefreshing,
}: {
  item: ItemDto | null
  onOpenChange: (open: boolean) => void
  onEdit: (item: ItemDto) => void
  onDelete: (item: ItemDto) => void
  /** Refetch da página de `GET /itens` aberta na tabela — é dela que vem o extrato. */
  onRefresh: () => void
  isRefreshing: boolean
}) {
  const [movementType, setMovementType] = useState<MovementType | null>(null)
  const [amount, setAmount] = useState("")
  const [destination, setDestination] = useState("")
  const [movementImageFile, setMovementImageFile] = useState<File | null>(null)
  const [pendingMovementUpload, setPendingMovementUpload] = useState<PendingMovementUpload | null>(null)
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null)
  // `image_url` vem preenchida mesmo sem foto enviada (presigned pra uma key que pode não
  // existir no bucket) — guarda o id do item/movimento cuja imagem falhou pra não tentar de novo.
  const [failedImageItemId, setFailedImageItemId] = useState<string | null>(null)
  const [failedMovementImageIds, setFailedMovementImageIds] = useState<ReadonlySet<string>>(new Set())
  const { mutate: createMovement, isPending: creatingMovement, error, reset } = useCreateItemMovement()
  const {
    mutate: uploadMovementImage,
    isPending: uploadingMovementImage,
    error: movementUploadError,
    reset: resetMovementUpload,
  } = useUploadItemImage()

  const isPending = creatingMovement || uploadingMovementImage

  const movementImagePreviewUrl = useMemo(
    () => (movementImageFile === null ? null : URL.createObjectURL(movementImageFile)),
    [movementImageFile]
  )
  useEffect(() => {
    return () => {
      if (movementImagePreviewUrl !== null) URL.revokeObjectURL(movementImagePreviewUrl)
    }
  }, [movementImagePreviewUrl])

  const cancelMovement = () => {
    reset()
    resetMovementUpload()
    setAmount("")
    setDestination("")
    setMovementType(null)
    setMovementImageFile(null)
    setPendingMovementUpload(null)
  }

  const close = (open: boolean) => {
    if (!open) cancelMovement()
    onOpenChange(open)
  }

  const submitMovement = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (item === null || movementType === null) {
      return
    }

    const movementLabel = movementType === "ENTRADA" ? "Entrada" : "Saída"

    createMovement(
      { id: item.id, payload: { movementType, amount: Number(amount), destination: destination.trim() } },
      {
        onSuccess: ({ uploadUrl }) => {
          if (movementImageFile === null) {
            toast.add({
              title: movementType === "ENTRADA" ? "Entrada registrada" : "Saída registrada",
              description: `Estoque de ${item.name} atualizado.`,
            })
            cancelMovement()
            return
          }

          uploadMovementImage(
            { uploadUrl, file: movementImageFile },
            {
              onSuccess: () => {
                toast.add({
                  title: movementType === "ENTRADA" ? "Entrada registrada" : "Saída registrada",
                  description: `Estoque de ${item.name} atualizado. Foto enviada.`,
                })
                cancelMovement()
              },
              // O movimento já existe — não recriar. Guarda o arquivo pra permitir só o reenvio do PUT.
              onError: () => setPendingMovementUpload({ uploadUrl, file: movementImageFile, movementLabel }),
            }
          )
        },
      }
    )
  }

  const retryMovementImageUpload = () => {
    if (pendingMovementUpload === null) return

    uploadMovementImage(
      { uploadUrl: pendingMovementUpload.uploadUrl, file: pendingMovementUpload.file },
      {
        onSuccess: () => {
          toast.add({ title: "Foto enviada", description: "Foto do movimento enviada com sucesso." })
          cancelMovement()
        },
      }
    )
  }

  const dismissPendingMovementUpload = () => {
    toast.add({
      title: "Movimento registrado sem foto",
      description: "A foto comprovante não foi salva, mas o movimento já foi registrado.",
    })
    cancelMovement()
  }

  return (
    <Dialog open={item !== null} onOpenChange={close}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {item?.name ?? "Produto"}
            {item === null ? null : (
              <Badge variant={ITEM_STATUS_BADGE[item.status]}>{ITEM_STATUS_LABEL[item.status]}</Badge>
            )}
          </DialogTitle>
          <DialogDescription>{item === null ? "" : ITEM_TYPE_LABEL[item.type]}</DialogDescription>
        </DialogHeader>

        {item !== null && pendingMovementUpload !== null ? (
          <Alert variant="destructive">
            <AlertTitle>O envio da foto falhou</AlertTitle>
            <AlertDescription>
              {pendingMovementUpload.movementLabel} de {item.name} já foi registrada — só a foto comprovante não foi
              salva. {movementUploadError?.message ?? "Tente reenviar o arquivo."}
            </AlertDescription>
          </Alert>
        ) : null}

        {item === null || pendingMovementUpload !== null ? null : (
          <div className="flex flex-col gap-4">
            {item.image_url === undefined || failedImageItemId === item.id ? null : (
              <button
                type="button"
                onClick={() => setZoomedImageUrl(item.image_url ?? null)}
                className="mx-auto cursor-zoom-in rounded-lg"
                aria-label={`Ampliar foto de ${item.name}`}
              >
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="h-40 w-40 rounded-lg border object-cover"
                  onError={() => setFailedImageItemId(item.id)}
                />
              </button>
            )}

            <div className="flex flex-col items-center gap-3 rounded-lg border bg-muted/50 py-4">
              <span className="text-sm text-muted-foreground">Saldo atual</span>
              <span className="font-heading text-4xl font-medium tabular-nums">{item.amount}</span>
              <div className="flex gap-2">
                <Button
                  variant={movementType === "ENTRADA" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMovementType("ENTRADA")}
                >
                  <ArrowDownIcon data-icon="inline-start" />
                  Entrada
                </Button>
                <Button
                  variant={movementType === "SAIDA" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMovementType("SAIDA")}
                >
                  <ArrowUpIcon data-icon="inline-start" />
                  Saída
                </Button>
              </div>
            </div>

            {item.description === undefined || item.description === "" ? null : (
              <p className="text-sm text-muted-foreground">{item.description}</p>
            )}

            {movementType === null ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Extrato</span>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Atualizar extrato"
                          disabled={isRefreshing}
                          onClick={onRefresh}
                        >
                          <RefreshCwIcon className={cn(isRefreshing && "animate-spin")} />
                        </Button>
                      }
                    />
                    <TooltipContent>Atualizar extrato</TooltipContent>
                  </Tooltip>
                </div>

                {item.movements.length === 0 ? (
                  <Empty className="border">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <HistoryIcon />
                      </EmptyMedia>
                      <EmptyTitle>Nenhuma movimentação</EmptyTitle>
                      <EmptyDescription>Registre uma entrada ou saída para começar o extrato.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <ItemGroup className="max-h-72 gap-2 overflow-y-auto">
                    {item.movements.map((movement) => (
                      <Item key={movement.id} variant="muted" size="sm">
                        {movement.image_url === undefined || failedMovementImageIds.has(movement.id) ? null : (
                          <ItemMedia>
                            <button
                              type="button"
                              onClick={() => setZoomedImageUrl(movement.image_url ?? null)}
                              className="cursor-zoom-in"
                              aria-label="Ampliar foto comprovante"
                            >
                              <img
                                src={movement.image_url}
                                alt=""
                                className="size-10 rounded-md border object-cover"
                                onError={() =>
                                  setFailedMovementImageIds((current) => new Set(current).add(movement.id))
                                }
                              />
                            </button>
                          </ItemMedia>
                        )}
                        <ItemContent>
                          <ItemTitle className="justify-between">
                            <Badge variant={MOVEMENT_TYPE_BADGE[movement.movementType]}>
                              {MOVEMENT_TYPE_LABEL[movement.movementType]}
                            </Badge>
                            <span className="tabular-nums">{movement.amount}</span>
                          </ItemTitle>
                          <ItemDescription>{movement.description}</ItemDescription>
                          <ItemDescription className="text-xs">{formatDateTime(movement.dateTime)}</ItemDescription>
                        </ItemContent>
                      </Item>
                    ))}
                  </ItemGroup>
                )}
              </div>
            ) : (
              <form
                id={MOVEMENT_FORM_ID}
                onSubmit={submitMovement}
                className="flex flex-col gap-3 rounded-lg border p-4"
              >
                {error === null ? null : (
                  <Alert variant="destructive">
                    <AlertTitle>Não foi possível registrar o movimento</AlertTitle>
                    <AlertDescription>{error.message}</AlertDescription>
                  </Alert>
                )}

                <Field>
                  <FieldLabel htmlFor="movimento-quantidade">
                    Quantidade — {MOVEMENT_TYPE_LABEL[movementType]}
                  </FieldLabel>
                  <Input
                    id="movimento-quantidade"
                    type="number"
                    min={1}
                    required
                    autoFocus
                    disabled={isPending}
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="movimento-destino">
                    {movementType === "ENTRADA" ? "Origem" : "Destino"}
                  </FieldLabel>
                  <Input
                    id="movimento-destino"
                    maxLength={MAX_NAME_LENGTH}
                    required
                    disabled={isPending}
                    value={destination}
                    onChange={(event) => setDestination(event.target.value)}
                    placeholder={
                      movementType === "ENTRADA" ? "Ex.: Fornecedor, doação..." : "Ex.: Setor, unidade, paciente..."
                    }
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="movimento-foto">Foto comprovante</FieldLabel>
                  {movementImageFile === null ? (
                    <Input
                      id="movimento-foto"
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
                        setMovementImageFile(file)
                      }}
                    />
                  ) : (
                    <Attachment>
                      <AttachmentMedia variant="image">
                        {movementImagePreviewUrl === null ? null : <img src={movementImagePreviewUrl} alt="" />}
                      </AttachmentMedia>
                      <AttachmentContent>
                        <AttachmentTitle>{movementImageFile.name}</AttachmentTitle>
                        <AttachmentDescription>{formatFileSize(movementImageFile.size)}</AttachmentDescription>
                      </AttachmentContent>
                      <AttachmentActions>
                        <AttachmentAction
                          aria-label="Remover foto"
                          disabled={isPending}
                          onClick={() => setMovementImageFile(null)}
                        >
                          <XIcon />
                        </AttachmentAction>
                      </AttachmentActions>
                    </Attachment>
                  )}
                  <FieldDescription>Opcional. Enviada direto para o armazenamento após o registro.</FieldDescription>
                </Field>
              </form>
            )}
          </div>
        )}

        <DialogFooter>
          {pendingMovementUpload !== null ? (
            <>
              <Button variant="ghost" onClick={dismissPendingMovementUpload} disabled={uploadingMovementImage}>
                <XIcon data-icon="inline-start" />
                Continuar sem foto
              </Button>
              <Button onClick={retryMovementImageUpload} disabled={uploadingMovementImage}>
                {uploadingMovementImage ? <Spinner data-icon="inline-start" /> : null}
                Tentar reenviar
              </Button>
            </>
          ) : movementType === null ? (
            <>
              <DialogClose render={<Button variant="outline">Fechar</Button>} />
              {item === null ? null : (
                <Button variant="destructive" onClick={() => onDelete(item)}>
                  <Trash2Icon data-icon="inline-start" />
                  Excluir
                </Button>
              )}
              {item === null ? null : (
                <Button variant="outline" onClick={() => onEdit(item)}>
                  <PencilIcon data-icon="inline-start" />
                  Editar
                </Button>
              )}
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={cancelMovement} disabled={isPending}>
                Cancelar
              </Button>
              <Button type="submit" form={MOVEMENT_FORM_ID} disabled={isPending}>
                {isPending ? <Spinner data-icon="inline-start" /> : null}
                Confirmar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>

      <ImageLightbox src={zoomedImageUrl} onOpenChange={(open) => (open ? null : setZoomedImageUrl(null))} />
    </Dialog>
  )
}
