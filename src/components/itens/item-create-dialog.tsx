import { useState } from "react"
import { PlusIcon } from "lucide-react"

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
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"

const INITIAL_FORM = { name: "", description: "" }

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

    createItem(
      { name: form.name, description: form.description === "" ? undefined : form.description },
      {
        onSuccess: (item) => {
          toast.add({ title: "Item cadastrado", description: `${item.name} foi adicionado ao almoxarifado.` })
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
            Novo item
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Novo item</DialogTitle>
            <DialogDescription>
              Cadastra um item via POST /itens. Situação e quantidade saem "Disponível" e "1" por padrão.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
            {error === null ? null : (
              <Alert variant="destructive">
                <AlertTitle>Não foi possível cadastrar o item</AlertTitle>
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
