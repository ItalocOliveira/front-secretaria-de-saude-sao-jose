import { useState } from "react"
import { PackageOpenIcon } from "lucide-react"

import type { InventoryItem } from "@/api/itens"
import { ITEM_STATUS, ITEM_TYPE_LIST, isLowStock } from "@/lib/itens"
import { itemTypeLabel } from "@/lib/report"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"

/** A lista abre recolhida; "Ver todos" mostra o resto. */
const COLLAPSED_LIMIT = 12

/** A partir daqui a lista vira 2 colunas em telas largas. */
const TWO_COLUMNS_FROM = 25

const SKELETON_ROWS = Array.from({ length: 6 }, (_, index) => index)

const NAME_COLLATOR = new Intl.Collator("pt-BR", { sensitivity: "base", numeric: true })

/** `start` = posição do primeiro item do grupo na lista inteira (para recolher na tela). */
type Group = { type: string; items: InventoryItem[]; units: number; start: number }

/** Agrupa por tipo, na ordem de `ITEM_TYPE_LIST` (tipos desconhecidos no fim), itens por nome. */
function groupByType(items: InventoryItem[]): Group[] {
  const groups = new Map<string, InventoryItem[]>()
  for (const item of items) {
    groups.set(item.type, [...(groups.get(item.type) ?? []), item])
  }

  const order = (type: string) => {
    const index = (ITEM_TYPE_LIST as string[]).indexOf(type)
    return index === -1 ? ITEM_TYPE_LIST.length : index
  }

  let start = 0
  return [...groups]
    .sort(([a], [b]) => order(a) - order(b) || a.localeCompare(b))
    .map(([type, list]) => {
      const group = {
        type,
        items: list.sort((a, b) => NAME_COLLATOR.compare(a.name, b.name)),
        units: list.reduce((sum, item) => sum + item.amount, 0),
        start,
      }
      start += list.length
      return group
    })
}

const formatCount = (value: number) => value.toLocaleString("pt-BR")

/**
 * Inventário completo: todos os itens do almoxarifado, agrupados por tipo, com a
 * quantidade atual. A versão do PDF fica em `report-print-document.tsx`.
 */
export function ReportInventoryListCard({
  items,
  isPending,
  error,
}: {
  items: InventoryItem[] | undefined
  isPending: boolean
  error: Error | null
}) {
  const [expanded, setExpanded] = useState(false)

  const groups = items === undefined ? [] : groupByType(items)
  const total = items?.length ?? 0
  const totalUnits = groups.reduce((sum, group) => sum + group.units, 0)
  const twoColumns = total >= TWO_COLUMNS_FROM
  const hiddenCount = total - COLLAPSED_LIMIT

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventário completo</CardTitle>
        <CardDescription>
          {items === undefined
            ? "Todos os itens cadastrados, com a quantidade atual"
            : `${formatCount(total)} ${total === 1 ? "item" : "itens"} · ${formatCount(totalUnits)} unidades em estoque hoje`}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Não foi possível carregar os itens</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        ) : isPending || items === undefined ? (
          <div className="flex flex-col gap-2">
            {SKELETON_ROWS.map((row) => (
              <Skeleton key={row} className="h-6 w-full" />
            ))}
          </div>
        ) : total === 0 ? (
          <Empty className="p-4">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PackageOpenIcon />
              </EmptyMedia>
              <EmptyTitle>Sem itens</EmptyTitle>
              <EmptyDescription>Nenhum item cadastrado no almoxarifado.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className={cn("gap-8", twoColumns && "lg:columns-2")}>
            {groups.map((group) => {
              const { start } = group
              const groupHidden = !expanded && start >= COLLAPSED_LIMIT

              return (
                <div key={group.type} className={cn("flex flex-col pb-4", groupHidden && "hidden")}>
                  <div className="flex break-after-avoid items-baseline justify-between gap-2 border-b border-border pb-1">
                    <span className="font-medium">{itemTypeLabel(group.type)}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {formatCount(group.items.length)} {group.items.length === 1 ? "item" : "itens"} ·{" "}
                      {formatCount(group.units)} un.
                    </span>
                  </div>

                  {group.items.map((item, index) => (
                    <div
                      key={item.id}
                      className={cn(
                        "flex break-inside-avoid items-center justify-between gap-2 border-b border-border/50 py-1",
                        !expanded && start + index >= COLLAPSED_LIMIT && "hidden"
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate" title={item.name}>
                        {item.name}
                      </span>
                      {item.status === ITEM_STATUS.EMPRESTADO ? <Badge variant="secondary">Emprestado</Badge> : null}
                      {isLowStock(item) ? <Badge variant="destructive">Baixo</Badge> : null}
                      <span className="tabular-nums">{formatCount(item.amount)}</span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      {!isPending && !error && hiddenCount > 0 ? (
        <CardFooter>
          <Button variant="ghost" size="sm" onClick={() => setExpanded((value) => !value)}>
            {expanded ? "Mostrar menos" : `Ver todos (+${formatCount(hiddenCount)})`}
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  )
}
