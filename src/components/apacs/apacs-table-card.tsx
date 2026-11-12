import { useState } from "react"
import {
  EyeIcon,
  FileTextIcon,
  InboxIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  SignalHighIcon,
  SignalLowIcon,
} from "lucide-react"

import type { Apac } from "@/api/apacs"
import type { PaginationInfo } from "@/api/pagination"
import {
  APAC_PRIORITY_LABEL,
  APAC_PROCEDURE_LABEL,
  APAC_STATUS_BADGE,
  APAC_STATUS_LABEL,
  type ApacPriority,
} from "@/lib/apac"
import { canDeleteApacs } from "@/lib/permissions"
import { cn } from "@/lib/utils"
import { useSession } from "@/hooks/use-session"
import { ApacDeleteAlert } from "@/components/apacs/apac-delete-alert"
import { ApacDetailsDialog } from "@/components/apacs/apac-details-dialog"
import { ApacEditDialog } from "@/components/apacs/apac-edit-dialog"
import { ListPagination } from "@/components/list-pagination"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const SKELETON_ROWS = 5
const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" })

function formatDate(value: string | null) {
  if (value === null) {
    return "—"
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "—" : DATE_FORMATTER.format(date)
}

/** Ícone de sinal + texto: a urgência não depende só de cor. */
function PriorityLabel({ priority }: { priority: ApacPriority }) {
  const urgent = priority === "URGENTE"
  const Icon = urgent ? SignalHighIcon : SignalLowIcon

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 whitespace-nowrap",
        urgent ? "font-semibold text-destructive" : "text-muted-foreground"
      )}
    >
      <Icon className="size-4" aria-hidden />
      {APAC_PRIORITY_LABEL[priority]}
    </span>
  )
}

/**
 * Uma página de `GET /apacs`. Quem busca os dados (página, busca, status) é a tela: a
 * tabela só exibe a página recebida e avisa quando o usuário troca de página.
 */
export function ApacsTableCard({
  apacs,
  pagination,
  onPageChange,
  isPending,
  isFetching,
  onRefresh,
  error,
  title = "APACs cadastradas",
  toolbar,
  onCreate,
  defaultSelectedId = null,
  emptyDescription = "Nenhuma APAC corresponde à busca. Ajuste o nome, limpe o filtro de status ou cadastre uma nova.",
}: {
  apacs: Apac[]
  /** `undefined` enquanto a primeira página não chegou. */
  pagination: PaginationInfo | undefined
  onPageChange: (page: number) => void
  isPending: boolean
  isFetching: boolean
  onRefresh: () => void
  error: Error | null
  title?: string
  /** Filtros exibidos entre o título e a tabela. */
  toolbar?: React.ReactNode
  /** Quando presente, o estado vazio oferece o atalho de cadastro. */
  onCreate?: () => void
  /** APAC cujo detalhe abre assim que aparecer na página (vindo do sino). Lido só na montagem. */
  defaultSelectedId?: string | null
  emptyDescription?: string
}) {
  const [selected, setSelected] = useState<Apac | null>(null)
  const [pendingOpenId, setPendingOpenId] = useState(defaultSelectedId)

  // Abre o detalhe pedido uma única vez, quando a APAC chega na página — ajuste durante o render.
  if (pendingOpenId !== null) {
    const match = apacs.find((apac) => apac.id === pendingOpenId)
    if (match !== undefined) {
      setPendingOpenId(null)
      setSelected(match)
    }
  }
  const [editing, setEditing] = useState<Apac | null>(null)
  const [deleting, setDeleting] = useState<Apac | null>(null)
  const { claims } = useSession()
  const canDelete = claims !== null && canDeleteApacs(claims.role)

  return (
    <Card className="gap-0 pb-0">
      <CardHeader className="pb-3.5">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          {title}
          {pagination === undefined ? null : (
            <Badge variant="outline" className="tabular-nums">
              {pagination.total}
            </Badge>
          )}
        </CardTitle>
        <CardAction>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Atualizar APACs"
                  disabled={isFetching}
                  onClick={onRefresh}
                >
                  <RefreshCwIcon className={cn(isFetching && "animate-spin")} />
                </Button>
              }
            />
            <TooltipContent>Atualizar</TooltipContent>
          </Tooltip>
        </CardAction>
      </CardHeader>

      {toolbar === undefined ? null : <div className="border-b px-4 pb-4">{toolbar}</div>}

      <CardContent className="px-0">
        {error !== null ? (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertTitle>Não foi possível carregar as APACs</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          </div>
        ) : null}

        {isPending ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: SKELETON_ROWS }, (_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : null}

        {!isPending && error === null && apacs.length === 0 ? (
          <Empty className="py-14">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <InboxIcon />
              </EmptyMedia>
              <EmptyTitle>Nenhuma APAC encontrada</EmptyTitle>
              <EmptyDescription>{emptyDescription}</EmptyDescription>
            </EmptyHeader>
            {onCreate === undefined ? null : (
              <EmptyContent>
                <Button onClick={onCreate}>
                  <PlusIcon data-icon="inline-start" />
                  Cadastrar APAC
                </Button>
              </EmptyContent>
            )}
          </Empty>
        ) : null}

        {apacs.length > 0 ? (
          <div className="overflow-x-auto">
            <Table className="min-w-215">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="pl-5">Paciente</TableHead>
                  <TableHead>Procedimento</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead className="pr-5 text-right">
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apacs.map((apac) => (
                  // A linha inteira abre o detalhe; os botões de ação continuam acessíveis pelo teclado.
                  <TableRow key={apac.id} className="cursor-pointer" onClick={() => setSelected(apac)}>
                    <TableCell className="py-3 pl-5">
                      <div className="flex flex-col">
                        <span className="font-semibold">{apac.name}</span>
                        <span className="text-[0.8125rem] text-muted-foreground">{apac.municipality ?? "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-80">
                      <span className="block truncate" title={APAC_PROCEDURE_LABEL[apac.procedure]}>
                        {APAC_PROCEDURE_LABEL[apac.procedure]}
                      </span>
                    </TableCell>
                    <TableCell>
                      <PriorityLabel priority={apac.priority} />
                    </TableCell>
                    <TableCell>
                      <Badge variant={APAC_STATUS_BADGE[apac.status]}>{APAC_STATUS_LABEL[apac.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">{formatDate(apac.createdAt)}</TableCell>
                    <TableCell className="pr-5">
                      <div className="flex justify-end" onClick={(event) => event.stopPropagation()}>
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
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Editar APAC de ${apac.name}`}
                                onClick={() => setEditing(apac)}
                              >
                                <PencilIcon />
                              </Button>
                            }
                          />
                          <TooltipContent>Editar</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}

        {pagination !== undefined && pagination.total > 0 ? (
          <ListPagination pagination={pagination} label="APACs" onPageChange={onPageChange} />
        ) : null}
      </CardContent>

      <ApacDetailsDialog
        apac={selected}
        onOpenChange={(open) => (open ? null : setSelected(null))}
        onEdit={(apac) => {
          setSelected(null)
          setEditing(apac)
        }}
        onDelete={
          canDelete
            ? (apac) => {
                setSelected(null)
                setDeleting(apac)
              }
            : undefined
        }
      />
      <ApacEditDialog apac={editing} onOpenChange={(open) => (open ? null : setEditing(null))} />
      {canDelete ? (
        <ApacDeleteAlert apac={deleting} onOpenChange={(open) => (open ? null : setDeleting(null))} />
      ) : null}
    </Card>
  )
}
