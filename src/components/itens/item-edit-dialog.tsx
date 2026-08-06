import { useState } from "react"
import { CheckIcon } from "lucide-react"

import type { ItemDto, UpdateItemPayload } from "@/api/itens"
import { ITEM_STATUS_LABEL, ITEM_STATUS_LIST, type ItemStatus } from "@/lib/itens"
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"

type FormValues = {
  name: string
  description: string
  status: ItemStatus
  amount: number
}

function toFormValues(item: ItemDto): FormValues {
  return {
    name: item.name,
    description: item.description ?? "",
    status: item.status,
    amount: item.amount,
  }
}

function diffPayload(item: ItemDto, values: FormValues): UpdateItemPayload {
  const payload: UpdateItemPayload = {}

  if (values.name !== item.name) payload.name = values.name
  if (values.description !== (item.description ?? "")) payload.description = values.description
  if (values.status !== item.status) payload.status = values.status
  if (values.amount !== item.amount) payload.amount = values.amount

  return payload
}

export function ItemEditDialog({
  item,
  onOpenChange,
}: {
  item: ItemDto | null
  onOpenChange: (open: boolean) => void
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
          <DialogTitle>Editar item</DialogTitle>
          <DialogDescription>Atualiza os dados via PATCH /itens/:id — envie só o que mudar.</DialogDescription>
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
              <FieldLabel htmlFor="editar-item-nome">Nome</FieldLabel>
              <Input
                id="editar-item-nome"
                value={current.name}
                onChange={(event) => setValues({ ...current, name: event.target.value })}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="editar-item-descricao">Descrição</FieldLabel>
              <Textarea
                id="editar-item-descricao"
                value={current.description}
                onChange={(event) => setValues({ ...current, description: event.target.value })}
              />
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
              <FieldLabel htmlFor="editar-item-quantidade">Quantidade</FieldLabel>
              <Input
                id="editar-item-quantidade"
                type="number"
                min={0}
                value={current.amount}
                onChange={(event) => setValues({ ...current, amount: Number(event.target.value) })}
              />
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
