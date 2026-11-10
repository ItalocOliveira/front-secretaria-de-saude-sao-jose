import { useState } from "react"
import { FileIcon, FileTextIcon, PencilIcon, RefreshCwIcon, Trash2Icon } from "lucide-react"

import type { Document } from "@/api/documents"
import { DOCUMENT_DESTINATION_LABEL, DOCUMENT_STATUS_BADGE, DOCUMENT_STATUS_LABEL } from "@/lib/document"
import { canDeleteDocuments } from "@/lib/permissions"
import { cn } from "@/lib/utils"
import { useDocuments } from "@/hooks/use-documents"
import { useSession } from "@/hooks/use-session"
import { DocumentDeleteAlert } from "@/components/documents/document-delete-alert"
import { DocumentEditDialog } from "@/components/documents/document-edit-dialog"
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

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "—" : DATE_FORMATTER.format(date)
}

function destinationLabel(document: Document) {
  return document.destination === "OUTRO" && document.otherDestination !== null
    ? document.otherDestination
    : DOCUMENT_DESTINATION_LABEL[document.destination]
}

export function DocumentsTableCard({
  documents,
  isPending,
  error,
}: {
  documents: Document[]
  isPending: boolean
  error: Error | null
}) {
  const [showAll, setShowAll] = useState(false)
  const [editing, setEditing] = useState<Document | null>(null)
  const [deleting, setDeleting] = useState<Document | null>(null)
  const { refetch, isFetching } = useDocuments()
  const { claims } = useSession()
  const canDelete = claims !== null && canDeleteDocuments(claims.role)

  const visible = showAll ? documents : documents.slice(0, PREVIEW_SIZE)
  const hasMore = documents.length > PREVIEW_SIZE

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Ofícios cadastrados
          {isPending ? null : <Badge variant="secondary">{documents.length}</Badge>}
        </CardTitle>
        <CardDescription>Documentos retornados por GET /documents.</CardDescription>
        <CardAction className="flex items-center gap-1">
          {hasMore ? (
            <Button variant="ghost" size="sm" onClick={() => setShowAll((current) => !current)}>
              {showAll ? "Ver menos" : "Ver todos"}
            </Button>
          ) : null}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Atualizar ofícios"
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

      <CardContent className="px-0">
        {error !== null ? (
          <div className="px-4">
            <Alert variant="destructive">
              <AlertTitle>Não foi possível carregar os ofícios</AlertTitle>
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
                  <FileIcon />
                </EmptyMedia>
                <EmptyTitle>Nenhum ofício encontrado</EmptyTitle>
                <EmptyDescription>Cadastre o primeiro documento ao lado.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : null}

        {visible.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Protocolo</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Cadastrado</TableHead>
                  <TableHead className="pr-4 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell className="pl-4 font-medium tabular-nums">{document.protocolNumber}</TableCell>
                    <TableCell>{document.name}</TableCell>
                    <TableCell className="text-muted-foreground">{destinationLabel(document)}</TableCell>
                    <TableCell>
                      <Badge variant={DOCUMENT_STATUS_BADGE[document.status]}>
                        {DOCUMENT_STATUS_LABEL[document.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {formatDate(document.createdAt)}
                    </TableCell>
                    <TableCell className="pr-4">
                      <div className="flex justify-end">
                        {document.pdfUrl === null ? null : (
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={`Ver PDF do ofício ${document.protocolNumber}`}
                                  render={<a href={document.pdfUrl} target="_blank" rel="noopener noreferrer" />}
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
                                aria-label={`Editar ofício ${document.protocolNumber}`}
                                onClick={() => setEditing(document)}
                              >
                                <PencilIcon />
                              </Button>
                            }
                          />
                          <TooltipContent>Editar</TooltipContent>
                        </Tooltip>
                        {canDelete ? (
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={`Excluir ofício ${document.protocolNumber}`}
                                  onClick={() => setDeleting(document)}
                                >
                                  <Trash2Icon />
                                </Button>
                              }
                            />
                            <TooltipContent>Excluir</TooltipContent>
                          </Tooltip>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}
      </CardContent>

      <DocumentEditDialog document={editing} onOpenChange={(open) => (open ? null : setEditing(null))} />
      {canDelete ? (
        <DocumentDeleteAlert document={deleting} onOpenChange={(open) => (open ? null : setDeleting(null))} />
      ) : null}
    </Card>
  )
}
