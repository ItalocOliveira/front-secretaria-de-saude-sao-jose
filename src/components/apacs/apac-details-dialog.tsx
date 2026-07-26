import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import type { Apac } from "@/api/apacs"
import { APAC_PRIORITY_LABEL, APAC_PROCEDURE_LABEL, APAC_STATUS_BADGE, APAC_STATUS_LABEL } from "@/lib/apac"
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
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"

const NOT_PROVIDED = "Não informado"

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Item variant="muted" size="sm">
      <ItemContent>
        <ItemDescription>{label}</ItemDescription>
        <ItemTitle>{children}</ItemTitle>
      </ItemContent>
    </Item>
  )
}

function formatDate(value: string | null) {
  if (value === null) {
    return NOT_PROVIDED
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? NOT_PROVIDED : format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
}

export function ApacDetailsDialog({
  apac,
  onOpenChange,
}: {
  apac: Apac | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={apac !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{apac?.name ?? "APAC"}</DialogTitle>
          <DialogDescription>Dados retornados por GET /apecs.</DialogDescription>
        </DialogHeader>

        {apac === null ? null : (
          <ItemGroup className="gap-2">
            {/* CNS e CPF chegam criptografados da API e são dado pessoal de saúde:
                não fazem parte do view model nem aparecem aqui. */}
            <DetailRow label="Procedimento">
              <Badge variant="secondary">{APAC_PROCEDURE_LABEL[apac.procedure]}</Badge>
            </DetailRow>
            <DetailRow label="Município">{apac.municipality ?? NOT_PROVIDED}</DetailRow>
            <DetailRow label="Data de nascimento">{formatDate(apac.birthDate)}</DetailRow>
            <DetailRow label="Cadastrada em">{formatDate(apac.createdAt)}</DetailRow>
            <DetailRow label="Situação">
              <Badge variant={APAC_STATUS_BADGE[apac.status]}>{APAC_STATUS_LABEL[apac.status]}</Badge>
              <Badge variant={apac.priority === "URGENTE" ? "destructive" : "outline"}>
                {APAC_PRIORITY_LABEL[apac.priority]}
              </Badge>
            </DetailRow>
          </ItemGroup>
        )}

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Fechar</Button>} />
          {/* Transição de status depende de endpoint de edição, ainda não implementado. */}
          <Button disabled>Alterar situação</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
