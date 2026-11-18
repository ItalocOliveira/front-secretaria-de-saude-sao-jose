import { Link } from "react-router"
import {
  ArrowLeftRightIcon,
  FileTextIcon,
  PackageIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  TriangleAlertIcon,
} from "lucide-react"

import type { ApacsReport } from "@/api/reports"
import type { ApacsLocationState } from "@/lib/apac-filters"
import { formatPercentChange } from "@/lib/report"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const NUMBER = new Intl.NumberFormat("pt-BR")
const SIGNED = new Intl.NumberFormat("pt-BR", { signDisplay: "exceptZero" })

const URGENT_QUEUE_STATE: ApacsLocationState = { priority: "URGENTE", status: "PENDENTE" }

function Kpi({
  to,
  state,
  icon: Icon,
  label,
  value,
  extra,
  alert = false,
}: {
  to: string
  state?: unknown
  icon: typeof FileTextIcon
  label: string
  value: React.ReactNode
  extra: React.ReactNode
  alert?: boolean
}) {
  return (
    <Link to={to} state={state} className="rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
      <Card size="sm" className="h-full transition-colors hover:bg-muted/50">
        <CardHeader>
          <CardTitle className={cn("flex items-center gap-2", alert && "text-destructive")}>
            <Icon className="size-4" aria-hidden />
            {label}
          </CardTitle>
        </CardHeader>
        {/* Número grande fora do `CardTitle`: o card `sm` fixa a tipografia do título. */}
        <CardContent className="flex flex-col gap-1.5">
          <span className="text-3xl leading-none font-bold tracking-tight tabular-nums">{value}</span>
          <span className="flex flex-wrap items-center gap-2 text-[0.8125rem] text-muted-foreground">{extra}</span>
        </CardContent>
      </Card>
    </Link>
  )
}

function Comparison({ comparison }: { comparison: ApacsReport["comparisonWithPreviousPeriod"] }) {
  const { percentChange, previousTotal } = comparison
  if (percentChange === null || percentChange === 0) {
    return <span>{previousTotal} no mês anterior</span>
  }

  const Icon = percentChange > 0 ? TrendingUpIcon : TrendingDownIcon
  return (
    <>
      <span className="inline-flex items-center gap-1 font-semibold text-foreground">
        <Icon className="size-4" aria-hidden />
        {formatPercentChange(percentChange)}
      </span>
      <span>vs. mês anterior ({previousTotal})</span>
    </>
  )
}

/**
 * Quatro números do mês, do `POST /reports/apacs` com `{}` (mês atual). Cada card leva à tela
 * correspondente. `inventory` é `null` para quem não acessa o almoxarifado — os dois cards somem.
 */
export function DashboardKpis({ report }: { report: ApacsReport | undefined }) {
  const loading = <Skeleton className="h-8 w-14" />
  const inventory = report?.inventory
  const urgent = report?.pendingQueue.byPriority.URGENTE ?? 0

  return (
    <section aria-label="Resumo do mês" className="grid gap-3 *:min-w-0 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi
        to="/apacs"
        icon={FileTextIcon}
        label="APACs no mês"
        value={report === undefined ? loading : NUMBER.format(report.totalCreatedINperiod)}
        extra={report === undefined ? null : <Comparison comparison={report.comparisonWithPreviousPeriod} />}
      />
      <Kpi
        to="/apacs"
        state={URGENT_QUEUE_STATE}
        icon={TriangleAlertIcon}
        label="Fila de APACs"
        value={report === undefined ? loading : NUMBER.format(report.pendingQueue.total)}
        extra={
          report === undefined ? null : (
            <>
              {urgent > 0 ? <Badge variant="destructive">{urgent} urgentes</Badge> : null}
              <span>pendentes, inseridas ou em análise</span>
            </>
          )
        }
      />
      {inventory === null ? null : (
        <>
          <Kpi
            to="/almoxarifado"
            icon={PackageIcon}
            label="Estoque abaixo do mínimo"
            alert={(inventory?.stock.lowStockCount ?? 0) > 0}
            value={inventory === undefined ? loading : NUMBER.format(inventory.stock.lowStockCount)}
            extra={
              inventory === undefined ? null : (
                <span>de {NUMBER.format(inventory.stock.totalItems)} itens cadastrados</span>
              )
            }
          />
          <Kpi
            to="/almoxarifado"
            icon={ArrowLeftRightIcon}
            label="Almoxarifado no mês"
            value={inventory === undefined ? loading : `${SIGNED.format(inventory.movementsInPeriod.balance)} un.`}
            extra={
              inventory === undefined ? null : (
                <span>
                  {inventory.movementsInPeriod.entries.count} entradas · {inventory.movementsInPeriod.outputs.count}{" "}
                  saídas
                </span>
              )
            }
          />
        </>
      )}
    </section>
  )
}
