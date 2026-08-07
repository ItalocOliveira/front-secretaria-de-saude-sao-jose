import { useState } from "react"
import { EyeIcon, PackageSearchIcon } from "lucide-react"

import type { ItemDto } from "@/api/itens"
import { ITEM_STATUS_BADGE, ITEM_STATUS_LABEL, ITEM_TYPE_LABEL } from "@/lib/itens"
import { ItemDeleteAlert } from "@/components/itens/item-delete-alert"
import { ItemDetailsDialog } from "@/components/itens/item-details-dialog"
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

/** Parte A: visão geral do estoque — produtos únicos com saldo consolidado. Detalhe/extrato ficam em `ItemDetailsDialog`. */
export function ItensTableCard({
  itens,
  isPending,
  error,
}: {
  itens: ItemDto[]
  isPending: boolean
  error: Error | null
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Deriva dos `itens` atuais em vez de guardar o objeto no state: assim o
  // dialog aberto reflete o histórico mais recente depois de qualquer
  // invalidação (criar movimento, editar, etc.), sem precisar de useEffect.
  const selected = itens.find((item) => item.id === selectedId) ?? null
  const editing = itens.find((item) => item.id === editingId) ?? null
  const deleting = itens.find((item) => item.id === deletingId) ?? null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Produtos cadastrados
          {isPending ? null : <Badge variant="secondary">{itens.length}</Badge>}
        </CardTitle>
        <CardDescription>Dados vindos de GET /itens.</CardDescription>
      </CardHeader>

      <CardContent className="px-0">
        {error !== null ? (
          <div className="px-4">
            <Alert variant="destructive">
              <AlertTitle>Não foi possível carregar os produtos</AlertTitle>
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
                <EmptyTitle>Nenhum produto cadastrado</EmptyTitle>
                <EmptyDescription>Cadastre o primeiro produto em "Novo produto".</EmptyDescription>
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
                  <TableHead>Tipo</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead className="pr-4 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itens.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="pl-4 font-medium">{item.name}</TableCell>
                    <TableCell className="text-muted-foreground">{ITEM_TYPE_LABEL[item.type]}</TableCell>
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
                                aria-label={`Ver detalhes de ${item.name}`}
                                onClick={() => setSelectedId(item.id)}
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

      <ItemDetailsDialog
        item={selected}
        onOpenChange={(open) => (open ? null : setSelectedId(null))}
        onEdit={(item) => {
          setSelectedId(null)
          setEditingId(item.id)
        }}
        onDelete={(item) => {
          setSelectedId(null)
          setDeletingId(item.id)
        }}
      />
      <ItemEditDialog item={editing} onOpenChange={(open) => (open ? null : setEditingId(null))} />
      <ItemDeleteAlert item={deleting} onOpenChange={(open) => (open ? null : setDeletingId(null))} />
    </Card>
  )
}
