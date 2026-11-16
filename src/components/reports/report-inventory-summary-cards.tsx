import { ArrowDownToLineIcon, ArrowUpFromLineIcon, PackageIcon, TriangleAlertIcon } from "lucide-react"

import type { ReportInventory } from "@/api/reports"
import { formatDifference } from "@/lib/report"
import { StatIcon } from "@/components/reports/report-summary-cards"
import { Badge } from "@/components/ui/badge"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const formatCount = (value: number) => value.toLocaleString("pt-BR")

/** O número grande do card é em unidades; a legenda diz quantas movimentações somaram isso. */
const movementsText = (count: number) =>
  count === 1 ? "unidades em 1 movimentação" : `unidades em ${formatCount(count)} movimentações`

export function ReportInventorySummaryCards({ inventory }: { inventory: ReportInventory | undefined }) {
  const stock = inventory?.stock
  const movements = inventory?.movementsInPeriod

  const value = (content: number | undefined) =>
    content === undefined ? <Skeleton className="h-7 w-12" /> : formatCount(content)

  const caption = (content: string | undefined) =>
    content === undefined ? (
      <Skeleton className="h-4 w-32" />
    ) : (
      <span className="text-xs text-muted-foreground">{content}</span>
    )

  return (
    <div className="grid gap-4 *:min-w-0 *:break-inside-avoid sm:grid-cols-2 xl:grid-cols-4">
      <Card size="sm">
        <CardHeader>
          <CardDescription>Itens cadastrados</CardDescription>
          <CardTitle className="text-2xl tabular-nums">{value(stock?.totalItems)}</CardTitle>
          <CardAction>
            <StatIcon icon={PackageIcon} />
          </CardAction>
        </CardHeader>
        <CardContent>
          {caption(stock === undefined ? undefined : `${formatCount(stock.totalUnits)} unidades em estoque hoje`)}
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardDescription>Estoque baixo</CardDescription>
          <CardTitle className="text-2xl tabular-nums">{value(stock?.lowStockCount)}</CardTitle>
          <CardAction>
            <StatIcon icon={TriangleAlertIcon} />
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          {stock === undefined ? (
            <Skeleton className="h-5 w-28" />
          ) : stock.lowStockCount > 0 ? (
            <Badge variant="destructive">Requer reposição</Badge>
          ) : (
            <Badge variant="outline">Nenhum item</Badge>
          )}
          <span className="text-xs text-muted-foreground">abaixo da quantidade mínima</span>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardDescription>Entradas no período</CardDescription>
          <CardTitle className="text-2xl tabular-nums">{value(movements?.entries.units)}</CardTitle>
          <CardAction>
            <StatIcon icon={ArrowDownToLineIcon} />
          </CardAction>
        </CardHeader>
        <CardContent>
          {caption(movements === undefined ? undefined : movementsText(movements.entries.count))}
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardDescription>Saídas no período</CardDescription>
          <CardTitle className="text-2xl tabular-nums">{value(movements?.outputs.units)}</CardTitle>
          <CardAction>
            <StatIcon icon={ArrowUpFromLineIcon} />
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          {movements === undefined ? (
            <Skeleton className="h-5 w-32" />
          ) : (
            <>
              <Badge variant={movements.balance < 0 ? "destructive" : "outline"}>
                Saldo {formatDifference(movements.balance)}
              </Badge>
              <span className="text-xs text-muted-foreground">{movementsText(movements.outputs.count)}</span>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
