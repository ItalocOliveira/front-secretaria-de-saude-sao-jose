import { useState } from "react"
import { PackageSearchIcon, PencilIcon, Trash2Icon } from "lucide-react"

import type { ItemDto } from "@/api/itens"
import { ITEM_STATUS_BADGE, ITEM_STATUS_LABEL } from "@/lib/itens"
import { ItemDeleteAlert } from "@/components/itens/item-delete-alert"
import { ItemEditDialog } from "@/components/itens/item-edit-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const SKELETON_ROWS = 5

export function ItensTableCard({
  itens,
  isPending,
  error,
}: {
  itens: ItemDto[]
  isPending: boolean
  error: Error | null
}) {
  const [editing, setEditing] = useState<ItemDto | null>(null)
  const [deleting, setDeleting] = useState<ItemDto | null>(null)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Itens cadastrados
          {isPending ? null : <Badge variant="secondary">{itens.length}</Badge>}
        </CardTitle>
        <CardDescription>Dados vindos de GET /itens.</CardDescription>
      </CardHeader>

      <CardContent className="px-0">
        {error !== null ? (
          <div className="px-4">
            <Alert variant="destructive">
              <AlertTitle>Não foi possível carregar os itens</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          </div>
        ) : null}

        {isPending ? (
          <div className="flex flex-col gap-2 px-4">
            {Array.from({ length: SKELETON_ROWS }, (_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : null}

        {!isPending && error === null && itens.length === 0 ? (
          <div className="px-4">
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <PackageSearchIcon />
                </EmptyMedia>
                <EmptyTitle>Nenhum item cadastrado</EmptyTitle>
                <EmptyDescription>Cadastre o primeiro item em "Novo item".</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : null}

        {itens.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead className="pr-4 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itens.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="pl-4 font-medium">{item.name}</TableCell>
                    <TableCell className="max-w-64 truncate text-muted-foreground">{item.description ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={ITEM_STATUS_BADGE[item.status]}>{ITEM_STATUS_LABEL[item.status]}</Badge>
                    </TableCell>
                    <TableCell className="tabular-nums">{item.amount}</TableCell>
                    <TableCell className="pr-4">
                      <div className="flex justify-end">
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Editar ${item.name}`}
                                onClick={() => setEditing(item)}
                              >
                                <PencilIcon />
                              </Button>
                            }
                          />
                          <TooltipContent>Editar</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Excluir ${item.name}`}
                                onClick={() => setDeleting(item)}
                              >
                                <Trash2Icon />
                              </Button>
                            }
                          />
                          <TooltipContent>Excluir</TooltipContent>
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

      <ItemEditDialog item={editing} onOpenChange={(open) => (open ? null : setEditing(null))} />
      <ItemDeleteAlert item={deleting} onOpenChange={(open) => (open ? null : setDeleting(null))} />
    </Card>
  )
}
