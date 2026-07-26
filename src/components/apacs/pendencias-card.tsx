import { useState } from "react"
import { EyeIcon, InboxIcon, PencilIcon, SendIcon } from "lucide-react"

import type { PendingApac } from "@/data/apacs-mock"
import { APAC_PRIORITY_LABEL, APAC_STATUS_BADGE, APAC_STATUS_LABEL } from "@/lib/apac"
import { ApacDetailsDialog } from "@/components/apacs/apac-details-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/toast"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const PREVIEW_SIZE = 5

export function PendenciasCard({ apacs }: { apacs: PendingApac[] }) {
  const [showAll, setShowAll] = useState(false)
  const [selected, setSelected] = useState<PendingApac | null>(null)

  const visible = showAll ? apacs : apacs.slice(0, PREVIEW_SIZE)
  const hasMore = apacs.length > PREVIEW_SIZE

  const notifyUnavailable = () => {
    toast.add({
      title: "Ação indisponível",
      description: "A edição de APACs ainda não existe na API.",
    })
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Pendências
          <Badge variant="destructive">{apacs.length}</Badge>
        </CardTitle>
        <CardDescription>APACs que precisam de ação antes de seguir para a regulação.</CardDescription>
        {hasMore ? (
          <CardAction>
            <Button variant="ghost" size="sm" onClick={() => setShowAll((current) => !current)}>
              {showAll ? "Ver menos" : "Ver todas"}
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>

      <CardContent className="px-0">
        {visible.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <InboxIcon />
              </EmptyMedia>
              <EmptyTitle>Nenhuma pendência encontrada</EmptyTitle>
              <EmptyDescription>Ajuste os filtros para ver outras APACs.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Paciente</TableHead>
                <TableHead>Procedimento</TableHead>
                <TableHead>Pendência</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-4 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((apac) => (
                <TableRow key={apac.id}>
                  <TableCell className="pl-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{apac.patientName}</span>
                      <span className="text-xs text-muted-foreground">APAC: {apac.apacNumber}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{apac.procedureName}</span>
                      <span className="text-xs text-muted-foreground">{apac.procedureCode}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="flex items-center gap-1.5 font-medium">
                        {apac.pendencyTitle}
                        {apac.blocking ? <Badge variant="destructive">Bloqueia</Badge> : null}
                      </span>
                      <span className="text-xs text-muted-foreground">{apac.pendencyDetail}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <Badge variant={APAC_STATUS_BADGE[apac.status]}>{APAC_STATUS_LABEL[apac.status]}</Badge>
                      {apac.priority === "URGENTE" ? (
                        <Badge variant="destructive">{APAC_PRIORITY_LABEL[apac.priority]}</Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="pr-4">
                    <div className="flex justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Ver detalhes da APAC ${apac.apacNumber}`}
                              onClick={() => setSelected(apac)}
                            >
                              <EyeIcon />
                            </Button>
                          }
                        />
                        <TooltipContent>Ver detalhes</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={apac.blocking ? "Editar APAC" : "Enviar ao Estado"}
                              onClick={notifyUnavailable}
                            >
                              {apac.blocking ? <PencilIcon /> : <SendIcon />}
                            </Button>
                          }
                        />
                        <TooltipContent>{apac.blocking ? "Editar" : "Enviar ao Estado"}</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <ApacDetailsDialog apac={selected} onOpenChange={(open) => (open ? null : setSelected(null))} />
    </Card>
  )
}
