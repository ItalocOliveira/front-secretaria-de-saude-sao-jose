import { useState } from "react"
import { ArrowDownUpIcon, CheckIcon } from "lucide-react"

import type { ItemDto, UpdateItemPayload } from "@/api/itens"
import {
  ITEM_STATUS_LABEL,
  ITEM_STATUS_LIST,
  ITEM_TYPE_LABEL,
  ITEM_TYPE_LIST,
  type ItemStatus,
  type ItemType,
} from "@/lib/itens"
import { useUpdateItem } from "@/hooks/use-itens"
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
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { MAX_NAME_LENGTH, MAX_TEXT_LENGTH } from "@/lib/field-limits"

type FormValues = {
  name: string
  description: string
  status: ItemStatus
  type: ItemType
}

function toFormValues(item: ItemDto): FormValues {
  return {
    name: item.name,
    description: item.description ?? "",
    status: item.status,
    type: item.type,
  }
}

function diffPayload(item: ItemDto, values: FormValues): UpdateItemPayload {
  const payload: UpdateItemPayload = {}

  if (values.name !== item.name) payload.name = values.name
  if (values.description !== (item.description ?? "")) payload.description = values.description
  if (values.status !== item.status) payload.status = values.status
  if (values.type !== item.type) payload.type = values.type

  return payload
}

/**
 * Edita nome, descrição, tipo e situação. A quantidade **não** é editável aqui: a API ignora
 * `amount` no `PATCH` — o estoque só muda por entrada/saída (`onMoveStock` abre os detalhes).
 */
export function ItemEditDialog({
  item,
  onOpenChange,
  onMoveStock,
}: {
  item: ItemDto | null
  onOpenChange: (open: boolean) => void
  onMoveStock: (item: ItemDto) => void
}) {
  const [values, setValues] = useState<FormValues | null>(null)
  const { mutate: updateItem, isPending, error, reset } = useUpdateItem()

  // Deriva do `item` recebido, mas permite o usuário digitar por cima — sem `useEffect`.
  const current = values ?? (item === null ? null : toFormValues(item))

  const close = () => {
    reset()
    setValues(null)
    onOpenChange(false)
  }

  const submit = () => {
    if (item === null || current === null) {
      return
    }

    const payload = diffPayload(item, current)
    if (Object.keys(payload).length === 0) {
      close()
      return
    }

    updateItem(
      { id: item.id, payload },
      {
        onSuccess: () => {
          toast.add({ title: "Item atualizado", description: `Os dados de ${item.name} foram salvos.` })
          close()
        },
      }
    )
  }

  return (
    <Dialog open={item !== null} onOpenChange={(open) => (open ? null : close())}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar produto</DialogTitle>
          <DialogDescription>Atualize os dados do produto. O estoque muda só por entrada ou saída.</DialogDescription>
        </DialogHeader>

        {current === null || item === null ? null : (
          <FieldGroup>
            {error === null ? null : (
              <Alert variant="destructive">
                <AlertTitle>Não foi possível salvar</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            )}

            <Field>
              <FieldLabel htmlFor="editar-item-nome">Nome</FieldLabel>
              <Input
                id="editar-item-nome"
                maxLength={MAX_NAME_LENGTH}
                value={current.name}
                onChange={(event) => setValues({ ...current, name: event.target.value })}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="editar-item-descricao">Descrição</FieldLabel>
              <Textarea
                id="editar-item-descricao"
                maxLength={MAX_TEXT_LENGTH}
                value={current.description}
                onChange={(event) => setValues({ ...current, description: event.target.value })}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="editar-item-tipo">Tipo</FieldLabel>
              <Select
                value={current.type}
                onValueChange={(type: string | null) =>
                  setValues({ ...current, type: (type ?? current.type) as ItemType })
                }
              >
                <SelectTrigger id="editar-item-tipo" className="w-full">
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
              <FieldLabel htmlFor="editar-item-status">Situação</FieldLabel>
              <Select
                value={current.status}
                onValueChange={(status: string | null) =>
                  setValues({ ...current, status: (status ?? current.status) as ItemStatus })
                }
              >
                <SelectTrigger id="editar-item-status" className="w-full">
                  <SelectValue placeholder="Selecione a situação">
                    {(status: string | null) =>
                      status ? ITEM_STATUS_LABEL[status as ItemStatus] : "Selecione a situação"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {ITEM_STATUS_LIST.map((status) => (
                      <SelectItem key={status} value={status}>
                        {ITEM_STATUS_LABEL[status]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="editar-item-quantidade">Quantidade em estoque</FieldLabel>
              <div className="flex gap-2">
                <Input id="editar-item-quantidade" type="number" readOnly value={item.amount} />
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => {
                    close()
                    onMoveStock(item)
                  }}
                >
                  <ArrowDownUpIcon data-icon="inline-start" />
                  Registrar entrada/saída
                </Button>
              </div>
              <FieldDescription>
                Para alterar o estoque, registre uma entrada ou saída — assim o extrato sempre fecha com o saldo.
              </FieldDescription>
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
