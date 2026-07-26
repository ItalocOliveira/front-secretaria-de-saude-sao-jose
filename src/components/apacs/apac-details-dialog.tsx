import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import type { PendingApac } from "@/data/apacs-mock"
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

export function ApacDetailsDialog({
  apac,
  onOpenChange,
}: {
  apac: PendingApac | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={!!apac} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>APAC {apac?.apacNumber}</DialogTitle>
          <DialogDescription>Detalhes da autorização e da pendência registrada.</DialogDescription>
        </DialogHeader>

        {apac ? (
          <ItemGroup className="gap-2">
            <DetailRow label="Paciente">{apac.patientName}</DetailRow>
            <DetailRow label="Procedimento">
              {apac.procedureName}
              <Badge variant="outline">{apac.procedureCode}</Badge>
              <Badge variant="secondary">{APAC_PROCEDURE_LABEL[apac.procedure]}</Badge>
            </DetailRow>
            <DetailRow label="Pendência">
              {apac.pendencyTitle} — {apac.pendencyDetail}
            </DetailRow>
            <DetailRow label="Unidade solicitante">{apac.unit}</DetailRow>
            <DetailRow label="Município">{apac.municipality}</DetailRow>
            <DetailRow label="Data da solicitação">
              {format(new Date(apac.requestedAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </DetailRow>
            <DetailRow label="Situação">
              <Badge variant={APAC_STATUS_BADGE[apac.status]}>{APAC_STATUS_LABEL[apac.status]}</Badge>
              <Badge variant={apac.priority === "URGENTE" ? "destructive" : "outline"}>
                {APAC_PRIORITY_LABEL[apac.priority]}
              </Badge>
            </DetailRow>
          </ItemGroup>
        ) : null}

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Fechar</Button>} />
          <Button disabled>Resolver pendência</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
