import { lazy, Suspense } from "react"
import { Link } from "react-router"
import { ChartPieIcon } from "lucide-react"

import type { ApacsReport } from "@/api/reports"
import { APAC_STATUS_LABEL } from "@/lib/apac"
import type { ApacsLocationState } from "@/lib/apac-filters"
import { DASHBOARD_STATUS_COLOR, DASHBOARD_STATUS_ORDER } from "@/lib/dashboard"
import type { StatusSlice } from "@/components/dashboard/dashboard-status-chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"

const DashboardStatusChart = lazy(() =>
  import("@/components/dashboard/dashboard-status-chart").then((module) => ({
    default: module.DashboardStatusChart,
  }))
)

const CHART_FALLBACK = <Skeleton className="size-52 shrink-0 rounded-full" />
const PERCENT = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 0 })

/**
 * `countByStatus` (toda a base do município, sem filtro de data) em pizza. A legenda traz número e
 * percentual — a cor nunca é a única pista — e cada linha abre `/apacs` já filtrada pelo status.
 */
export function DashboardStatusCard({ countByStatus }: { countByStatus: ApacsReport["countByStatus"] | undefined }) {
  // Chaves com 0 não vêm da API: ausência conta como 0.
  const slices: StatusSlice[] = DASHBOARD_STATUS_ORDER.map((status) => ({
    status,
    label: APAC_STATUS_LABEL[status],
    count: countByStatus?.[status] ?? 0,
    fill: DASHBOARD_STATUS_COLOR[status],
  }))
  const total = slices.reduce((sum, slice) => sum + slice.count, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>APACs por status</CardTitle>
        <CardDescription>Toda a base do município · clique num status para filtrar</CardDescription>
      </CardHeader>
      <CardContent>
        {countByStatus !== undefined && total === 0 ? (
          <Empty className="p-4">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ChartPieIcon />
              </EmptyMedia>
              <EmptyTitle>Nenhuma APAC cadastrada</EmptyTitle>
              <EmptyDescription>O gráfico aparece quando houver APACs no município.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            {countByStatus === undefined ? (
              CHART_FALLBACK
            ) : (
              <Suspense fallback={CHART_FALLBACK}>
                <DashboardStatusChart slices={slices.filter((slice) => slice.count > 0)} total={total} />
              </Suspense>
            )}

            <ul className="flex w-full min-w-0 flex-col gap-0.5">
              {slices.map((slice) => {
                const state: ApacsLocationState = { status: slice.status }
                return (
                  <li key={slice.status}>
                    <Link
                      to="/apacs"
                      state={state}
                      className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      <span className="size-2.5 shrink-0 rounded-sm" style={{ background: slice.fill }} aria-hidden />
                      <span className="truncate">{slice.label}</span>
                      {countByStatus === undefined ? (
                        <Skeleton className="ml-auto h-4 w-12" />
                      ) : (
                        <>
                          <span className="ml-auto font-semibold tabular-nums">
                            {slice.count.toLocaleString("pt-BR")}
                          </span>
                          <span className="w-10 text-right text-muted-foreground tabular-nums">
                            {PERCENT.format(total === 0 ? 0 : slice.count / total)}
                          </span>
                        </>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
