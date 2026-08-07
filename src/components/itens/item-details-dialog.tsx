import { useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ArrowDownIcon, ArrowUpIcon, HistoryIcon, PencilIcon, RefreshCwIcon, Trash2Icon } from "lucide-react"

import type { ItemDto } from "@/api/itens"
import {
  ITEM_STATUS_BADGE,
  ITEM_STATUS_LABEL,
  ITEM_TYPE_LABEL,
  MOVEMENT_TYPE_BADGE,
  MOVEMENT_TYPE_LABEL,
  type MovementType,
} from "@/lib/itens"
import { useCreateItemMovement, useItens } from "@/hooks/use-itens"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const MOVEMENT_FORM_ID = "item-movement-form"

function formatDateTime(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "—" : format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

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
}: {
  item: ItemDto | null
  onOpenChange: (open: boolean) => void
  onEdit: (item: ItemDto) => void
  onDelete: (item: ItemDto) => void
}) {
  const [movementType, setMovementType] = useState<MovementType | null>(null)
  const [amount, setAmount] = useState("")
  const { mutate: createMovement, isPending, error, reset } = useCreateItemMovement()
  // Reaproveita a query já ativa em `ItensTableCard` (mesma `queryKey`, sem requisição extra) só para expor o refetch manual do extrato.
  const { refetch: refetchItens, isFetching: isRefetchingItens } = useItens()

  const cancelMovement = () => {
    reset()
    setAmount("")
    setMovementType(null)
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

    createMovement(
      { id: item.id, payload: { movementType, amount: Number(amount) } },
      {
        onSuccess: () => {
          toast.add({
            title: movementType === "ENTRADA" ? "Entrada registrada" : "Saída registrada",
            description: `Estoque de ${item.name} atualizado.`,
          })
          cancelMovement()
        },
      }
    )
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

        {item === null ? null : (
          <div className="flex flex-col gap-4">
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
                          disabled={isRefetchingItens}
                          onClick={() => refetchItens()}
                        >
                          <RefreshCwIcon className={cn(isRefetchingItens && "animate-spin")} />
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
              </form>
            )}
          </div>
        )}

        <DialogFooter>
          {movementType === null ? (
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
    </Dialog>
  )
}
