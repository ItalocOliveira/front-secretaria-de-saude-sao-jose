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
import {
  APAC_PRIORITY_LABEL,
  APAC_PROCEDURE_LABEL,
  APAC_STATUS_BADGE,
  APAC_STATUS_LABEL,
  type ApacPriority,
} from "@/lib/apac"
import { cn } from "@/lib/utils"
import { useApacs } from "@/hooks/use-apacs"
import { ApacDeleteAlert } from "@/components/apacs/apac-delete-alert"
import { ApacDetailsDialog } from "@/components/apacs/apac-details-dialog"
import { ApacEditDialog } from "@/components/apacs/apac-edit-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const SKELETON_ROWS = 5
const PAGE_SIZE = 6

type PageItem = number | "ellipsis-start" | "ellipsis-end"

/** Primeira, última e vizinhas da atual; o resto vira reticências. */
function getPageItems(current: number, total: number): PageItem[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  const middle = Array.from({ length: end - start + 1 }, (_, index) => start + index)

  return [
    1,
    ...(start > 2 ? (["ellipsis-start"] as const) : []),
    ...middle,
    ...(end < total - 1 ? (["ellipsis-end"] as const) : []),
    total,
  ]
}

function TablePagination({
  page,
  pageCount,
  total,
  onPageChange,
}: {
  page: number
  pageCount: number
  total: number
  onPageChange: (page: number) => void
}) {
  const first = (page - 1) * PAGE_SIZE + 1
  const last = Math.min(page * PAGE_SIZE, total)

  // Links sem navegação real: a página vive no estado, não na URL.
  const go = (target: number) => (event: React.MouseEvent) => {
    event.preventDefault()
    if (target >= 1 && target <= pageCount && target !== page) {
      onPageChange(target)
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3">
      <span className="text-sm text-muted-foreground tabular-nums">
        Mostrando {first}–{last} de {total}
      </span>

      {pageCount > 1 ? (
        <Pagination aria-label="Paginação das APACs" className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                text="Anterior"
                aria-label="Página anterior"
                aria-disabled={page === 1}
                className={cn(page === 1 && "pointer-events-none opacity-50")}
                onClick={go(page - 1)}
              />
            </PaginationItem>
            {getPageItems(page, pageCount).map((item) =>
              typeof item === "number" ? (
                <PaginationItem key={item}>
                  <PaginationLink
                    href="#"
                    isActive={item === page}
                    aria-label={`Página ${item}`}
                    className="tabular-nums"
                    onClick={go(item)}
                  >
                    {item}
                  </PaginationLink>
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <PaginationEllipsis />
                </PaginationItem>
              )
            )}
            <PaginationItem>
              <PaginationNext
                href="#"
                text="Próxima"
                aria-label="Próxima página"
                aria-disabled={page === pageCount}
                className={cn(page === pageCount && "pointer-events-none opacity-50")}
                onClick={go(page + 1)}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  )
}

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

export function ApacsTableCard({
  apacs,
  isPending,
  error,
  title = "APACs cadastradas",
  toolbar,
  onCreate,
  pageResetKey,
}: {
  apacs: Apac[]
  isPending: boolean
  error: Error | null
  title?: string
  /** Filtros exibidos entre o título e a tabela. */
  toolbar?: React.ReactNode
  /** Quando presente, o estado vazio oferece o atalho de cadastro. */
  onCreate?: () => void
  /** Quando muda (ex.: filtros), a paginação volta para a primeira página. */
  pageResetKey?: string
}) {
  const [selected, setSelected] = useState<Apac | null>(null)
  const [editing, setEditing] = useState<Apac | null>(null)
  const [deleting, setDeleting] = useState<Apac | null>(null)
  const { refetch, isFetching } = useApacs()
  const [page, setPage] = useState(1)
  const [lastResetKey, setLastResetKey] = useState(pageResetKey)

  // Ajuste durante o render (sem `useEffect`): filtro novo volta para a página 1.
  if (pageResetKey !== lastResetKey) {
    setLastResetKey(pageResetKey)
    setPage(1)
  }

  const pageCount = Math.max(1, Math.ceil(apacs.length / PAGE_SIZE))
  // Se a lista encolher (exclusão, filtro), não fica numa página que não existe mais.
  const currentPage = Math.min(page, pageCount)
  const pageApacs = apacs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <Card className="gap-0 pb-0">
      <CardHeader className="pb-3.5">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          {title}
          {isPending ? null : (
            <Badge variant="outline" className="tabular-nums">
              {apacs.length}
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
                  onClick={() => refetch()}
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
              <EmptyDescription>
                Nenhuma APAC corresponde aos filtros escolhidos. Ajuste a busca, limpe os filtros ou cadastre uma nova.
              </EmptyDescription>
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
                {pageApacs.map((apac) => (
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

        {apacs.length > 0 ? (
          <TablePagination page={currentPage} pageCount={pageCount} total={apacs.length} onPageChange={setPage} />
        ) : null}
      </CardContent>

      <ApacDetailsDialog
        apac={selected}
        onOpenChange={(open) => (open ? null : setSelected(null))}
        onEdit={(apac) => {
          setSelected(null)
          setEditing(apac)
        }}
        onDelete={(apac) => {
          setSelected(null)
          setDeleting(apac)
        }}
      />
      <ApacEditDialog apac={editing} onOpenChange={(open) => (open ? null : setEditing(null))} />
      <ApacDeleteAlert apac={deleting} onOpenChange={(open) => (open ? null : setDeleting(null))} />
    </Card>
  )
}
