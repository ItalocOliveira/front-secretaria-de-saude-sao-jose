import { useState } from "react"
import { CheckIcon } from "lucide-react"

import type { Apac, UpdateApacPayload } from "@/api/apacs"
import { MUNICIPALITIES } from "@/data/apacs-mock"
import {
  APAC_ACS_LABEL,
  APAC_ACS_LIST,
  APAC_PROCEDURE_LABEL,
  APAC_PROCEDURE_LIST,
  type ApacAcs,
  type ApacProcedure,
} from "@/lib/apac"
import { useUpdateApac } from "@/hooks/use-apacs"
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
import { toast } from "@/components/ui/toast"

type FormValues = { name: string; acs: ApacAcs; procedure: ApacProcedure; municipality: string }

function toFormValues(apac: Apac): FormValues {
  return { name: apac.name, acs: apac.acs, procedure: apac.procedure, municipality: apac.municipality ?? "" }
}

function diffPayload(apac: Apac, values: FormValues): UpdateApacPayload {
  const payload: UpdateApacPayload = {}

  if (values.name !== apac.name) payload.name = values.name
  if (values.acs !== apac.acs) payload.acs = values.acs
  if (values.procedure !== apac.procedure) payload.procedure = values.procedure
  if (values.municipality !== (apac.municipality ?? "")) payload.municipality = values.municipality

  return payload
}

export function ApacEditDialog({ apac, onOpenChange }: { apac: Apac | null; onOpenChange: (open: boolean) => void }) {
  const [values, setValues] = useState<FormValues | null>(null)
  const { mutate: updateApac, isPending, error, reset } = useUpdateApac()

  // Deriva do `apac` recebido, mas permite o usuário digitar por cima — sem `useEffect`.
  const current = values ?? (apac === null ? null : toFormValues(apac))

  const close = () => {
    reset()
    setValues(null)
    onOpenChange(false)
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
          <DialogDescription>Só nome, ACS, procedimento e município podem ser alterados por aqui.</DialogDescription>
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
              <Select
                value={current.procedure}
                onValueChange={(procedure: string | null) =>
                  setValues({ ...current, procedure: (procedure ?? current.procedure) as ApacProcedure })
                }
              >
                <SelectTrigger id="editar-procedimento" className="w-full">
                  <SelectValue placeholder="Selecione o tipo">
                    {(procedure: string | null) =>
                      procedure ? APAC_PROCEDURE_LABEL[procedure as ApacProcedure] : "Selecione o tipo"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {APAC_PROCEDURE_LIST.map((procedure) => (
                      <SelectItem key={procedure} value={procedure}>
                        {APAC_PROCEDURE_LABEL[procedure]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
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
