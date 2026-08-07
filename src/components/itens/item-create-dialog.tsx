import { useState } from "react"
import { PlusIcon } from "lucide-react"

import { ITEM_TYPE_LABEL, ITEM_TYPE_LIST, type ItemType } from "@/lib/itens"
import { useCreateItem } from "@/hooks/use-itens"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"

const INITIAL_FORM = { name: "", description: "", type: null as ItemType | null }

/**
 * Cadastro de produto no catálogo — sem quantidade. O produto nasce com
 * saldo 0 e sem movimento no histórico; entrada/saída de estoque acontecem
 * depois, na tela de detalhe do produto (`ItemDetailsDialog`).
 */
export function ItemCreateDialog() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)
  const { mutate: createItem, isPending, error, reset } = useCreateItem()

  const patch = (partial: Partial<typeof INITIAL_FORM>) => setForm((current) => ({ ...current, ...partial }))

  const close = () => {
    reset()
    setForm(INITIAL_FORM)
    setOpen(false)
  }

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (form.type === null) {
      return
    }

    createItem(
      { name: form.name, description: form.description === "" ? undefined : form.description, type: form.type },
      {
        onSuccess: (item) => {
          toast.add({ title: "Produto cadastrado", description: `${item.name} foi adicionado ao almoxarifado.` })
          close()
        },
      }
    )
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
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Novo produto</DialogTitle>
            <DialogDescription>
              Cadastra o produto no catálogo via POST /itens, sem estoque. Lance uma entrada depois, nos detalhes do
              produto.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
            {error === null ? null : (
              <Alert variant="destructive">
                <AlertTitle>Não foi possível cadastrar o produto</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            )}

            <Field>
              <FieldLabel htmlFor="item-nome">Nome</FieldLabel>
              <Input
                id="item-nome"
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
              <FieldLabel htmlFor="item-descricao">Descrição</FieldLabel>
              <Textarea
                id="item-descricao"
                disabled={isPending}
                value={form.description}
                onChange={(event) => patch({ description: event.target.value })}
              />
              <FieldDescription>Opcional.</FieldDescription>
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
      </DialogContent>
    </Dialog>
  )
}
