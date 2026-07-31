import { useState } from "react"
import { EyeIcon, FileTextIcon, InboxIcon } from "lucide-react"

import type { Apac } from "@/api/apacs"
import { APAC_PRIORITY_LABEL, APAC_PROCEDURE_LABEL, APAC_STATUS_BADGE, APAC_STATUS_LABEL } from "@/lib/apac"
import { ApacDetailsDialog } from "@/components/apacs/apac-details-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const PREVIEW_SIZE = 5

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" })

function formatDate(value: string | null) {
  if (value === null) {
    return "—"
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "—" : DATE_FORMATTER.format(date)
}

export function ApacsTableCard({
  apacs,
  isPending,
  error,
}: {
  apacs: Apac[]
  isPending: boolean
  error: Error | null
}) {
  const [showAll, setShowAll] = useState(false)
  const [selected, setSelected] = useState<Apac | null>(null)

  const visible = showAll ? apacs : apacs.slice(0, PREVIEW_SIZE)
  const hasMore = apacs.length > PREVIEW_SIZE

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          APACs cadastradas
          {isPending ? null : <Badge variant="secondary">{apacs.length}</Badge>}
        </CardTitle>
        <CardDescription>Autorizações retornadas por GET /apacs.</CardDescription>
        {hasMore ? (
          <CardAction>
            <Button variant="ghost" size="sm" onClick={() => setShowAll((current) => !current)}>
              {showAll ? "Ver menos" : "Ver todas"}
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>

      <CardContent className="px-0">
        {error !== null ? (
          <div className="px-4">
            <Alert variant="destructive">
              <AlertTitle>Não foi possível carregar as APACs</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          </div>
        ) : null}

        {isPending ? (
          <div className="flex flex-col gap-2 px-4">
            {Array.from({ length: PREVIEW_SIZE }, (_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : null}

        {!isPending && error === null && visible.length === 0 ? (
          <div className="px-4">
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <InboxIcon />
                </EmptyMedia>
                <EmptyTitle>Nenhuma APAC encontrada</EmptyTitle>
                <EmptyDescription>Ajuste os filtros ou cadastre a primeira autorização.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : null}

        {visible.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Paciente</TableHead>
                  <TableHead>Procedimento</TableHead>
                  <TableHead>Município</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Cadastrada</TableHead>
                  <TableHead className="pr-4 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((apac) => (
                  <TableRow key={apac.id}>
                    <TableCell className="pl-4 font-medium">{apac.name}</TableCell>
                    <TableCell>{APAC_PROCEDURE_LABEL[apac.procedure]}</TableCell>
                    <TableCell className="text-muted-foreground">{apac.municipality ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <Badge variant={APAC_STATUS_BADGE[apac.status]}>{APAC_STATUS_LABEL[apac.status]}</Badge>
                        {apac.priority === "URGENTE" ? (
                          <Badge variant="destructive">{APAC_PRIORITY_LABEL[apac.priority]}</Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">{formatDate(apac.createdAt)}</TableCell>
                    <TableCell className="pr-4">
                      <div className="flex justify-end">
                        {/* Editar/excluir/enviar dependem de endpoints ainda não
                            implementados no backend — nem chegam a ser oferecidos. */}
                        {apac.pdfUrl === null ? null : (
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={`Ver PDF da APAC de ${apac.name}`}
                                  render={<a href={apac.pdfUrl} target="_blank" rel="noopener noreferrer" />}
                                >
                                  <FileTextIcon />
                                </Button>
                              }
                            />
                            <TooltipContent>Ver PDF</TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Ver detalhes da APAC de ${apac.name}`}
                                onClick={() => setSelected(apac)}
                              >
                                <EyeIcon />
                              </Button>
                            }
                          />
                          <TooltipContent>Ver detalhes</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}
      </CardContent>

      <ApacDetailsDialog apac={selected} onOpenChange={(open) => (open ? null : setSelected(null))} />
    </Card>
  )
}
