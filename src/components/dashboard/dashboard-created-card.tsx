import { lazy, Suspense } from "react"
import { Link } from "react-router"

import type { ApacsReport } from "@/api/reports"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// `recharts` é pesado: só baixa quando o dashboard abre.
const DashboardCreatedChart = lazy(() =>
  import("@/components/dashboard/dashboard-created-chart").then((module) => ({
    default: module.DashboardCreatedChart,
  }))
)

const CHART_FALLBACK = <Skeleton className="h-56 w-full" />

export function DashboardCreatedCard({ report, monthLabel }: { report: ApacsReport | undefined; monthLabel: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>APACs cadastradas por dia</CardTitle>
        <CardDescription>
          {monthLabel}
          {report === undefined ? null : ` · ${report.totalCreatedINperiod.toLocaleString("pt-BR")} no mês`}
        </CardDescription>
        <CardAction>
          <Link
            to="/relatorios"
            className="text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
          >
            Abrir relatório
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        {report === undefined ? (
          CHART_FALLBACK
        ) : (
          <Suspense fallback={CHART_FALLBACK}>
            <DashboardCreatedChart points={report.createdOverTime.points} />
          </Suspense>
        )}
      </CardContent>
    </Card>
  )
}
