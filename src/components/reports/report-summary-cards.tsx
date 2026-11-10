import { FilePlus2Icon, HistoryIcon, ListTodoIcon, SirenIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react"

import type { ApacsReport } from "@/api/reports"
import { formatDifference, formatPercentChange, formatReportDate } from "@/lib/report"
import { Badge } from "@/components/ui/badge"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function ComparisonBadge({ comparison }: { comparison: ApacsReport["comparisonWithPreviousPeriod"] }) {
  const { percentChange, difference } = comparison

  // Sem base de comparação: só a diferença absoluta faz sentido.
  if (percentChange === null) {
    return difference === 0 ? (
      <Badge variant="outline">Sem variação</Badge>
    ) : (
      <Badge variant="outline">{formatDifference(difference)} (nenhuma no período anterior)</Badge>
    )
  }

  if (percentChange === 0) {
    return <Badge variant="outline">Sem variação</Badge>
  }

  return percentChange > 0 ? (
    <Badge variant="secondary">
      <TrendingUpIcon data-icon="inline-start" />
      {formatPercentChange(percentChange)}
    </Badge>
  ) : (
    <Badge variant="destructive">
      <TrendingDownIcon data-icon="inline-start" />
      {formatPercentChange(percentChange)}
    </Badge>
  )
}

function StatIcon({ icon: Icon }: { icon: typeof FilePlus2Icon }) {
  return (
    <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
      <Icon className="size-4" />
    </div>
  )
}

export function ReportSummaryCards({ report, isPending }: { report: ApacsReport | undefined; isPending: boolean }) {
  const comparison = report?.comparisonWithPreviousPeriod
  const urgent = report?.pendingQueue.byPriority.URGENTE ?? 0
  const elective = report?.pendingQueue.byPriority.ELETIVO ?? 0

  const value = (content: number | undefined) =>
    isPending || content === undefined ? <Skeleton className="h-7 w-12" /> : content.toLocaleString("pt-BR")

  return (
    <div className="grid gap-4 *:min-w-0 *:break-inside-avoid sm:grid-cols-2 xl:grid-cols-4">
      <Card size="sm">
        <CardHeader>
          <CardDescription>APACs criadas no período</CardDescription>
          <CardTitle className="text-2xl tabular-nums">{value(report?.totalCreatedINperiod)}</CardTitle>
          <CardAction>
            <StatIcon icon={FilePlus2Icon} />
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          {comparison === undefined ? (
            <Skeleton className="h-5 w-32" />
          ) : (
            <>
              <ComparisonBadge comparison={comparison} />
              <span className="text-xs text-muted-foreground">em relação ao período anterior</span>
            </>
          )}
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardDescription>Período anterior</CardDescription>
          <CardTitle className="text-2xl tabular-nums">{value(comparison?.previousTotal)}</CardTitle>
          <CardAction>
            <StatIcon icon={HistoryIcon} />
          </CardAction>
        </CardHeader>
        <CardContent>
          {comparison === undefined ? (
            <Skeleton className="h-4 w-36" />
          ) : (
            <span className="text-xs text-muted-foreground">
              {formatReportDate(comparison.previousPeriod.startDate)} a{" "}
              {formatReportDate(comparison.previousPeriod.endDate)}
            </span>
          )}
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardDescription>Fila de pendentes</CardDescription>
          <CardTitle className="text-2xl tabular-nums">{value(report?.pendingQueue.total)}</CardTitle>
          <CardAction>
            <StatIcon icon={ListTodoIcon} />
          </CardAction>
        </CardHeader>
        <CardContent>
          <span className="text-xs text-muted-foreground">Situação atual, independe do período</span>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardDescription>Urgentes na fila</CardDescription>
          <CardTitle className="text-2xl tabular-nums">{value(report === undefined ? undefined : urgent)}</CardTitle>
          <CardAction>
            <StatIcon icon={SirenIcon} />
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          {report === undefined ? (
            <Skeleton className="h-5 w-28" />
          ) : urgent > 0 ? (
            <Badge variant="destructive">Requer atenção</Badge>
          ) : (
            <Badge variant="outline">Nenhuma urgente</Badge>
          )}
          <span className="text-xs text-muted-foreground">{elective.toLocaleString("pt-BR")} eletivas</span>
        </CardContent>
      </Card>
    </div>
  )
}
