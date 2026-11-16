import { lazy, Suspense } from "react"

import type { ApacsReport } from "@/api/reports"

const ReportCreatedChart = lazy(() =>
  import("@/components/reports/report-created-chart").then((module) => ({ default: module.ReportCreatedChart }))
)

const ReportTopOutputsChart = lazy(() =>
  import("@/components/reports/report-top-outputs-chart").then((module) => ({
    default: module.ReportTopOutputsChart,
  }))
)

/**
 * Folha de gráficos do PDF: só existe na impressão, sempre numa página própria
 * (depois dos textos de APACs e do almoxarifado) e sem dividir espaço com texto.
 * Na tela cada gráfico aparece junto da sua seção.
 */
export function ReportChartsPrintSheet({ report }: { report: ApacsReport }) {
  const topOutputs = report.inventory?.movementsInPeriod.topOutputItems ?? []
  const isWeekly = report.createdOverTime.interval === "week"

  return (
    <section className="hidden flex-col gap-8 print:flex print:break-before-page print:break-inside-avoid">
      <h2 className="font-heading text-lg font-medium">Gráficos</h2>

      <figure className="flex flex-col gap-2">
        <figcaption className="flex flex-col">
          <span className="font-medium">APACs criadas ao longo do tempo</span>
          <span className="text-sm text-muted-foreground">
            {isWeekly ? "Total por semana (a partir de segunda-feira)" : "Total por dia"}
          </span>
        </figcaption>
        <Suspense fallback={null}>
          <ReportCreatedChart series={report.createdOverTime} variant="print" />
        </Suspense>
      </figure>

      {topOutputs.length > 0 ? (
        <figure className="flex flex-col gap-2">
          <figcaption className="flex flex-col">
            <span className="font-medium">Almoxarifado — itens mais retirados</span>
            <span className="text-sm text-muted-foreground">Unidades retiradas no período</span>
          </figcaption>
          <Suspense fallback={null}>
            <ReportTopOutputsChart items={topOutputs} variant="print" />
          </Suspense>
        </figure>
      ) : null}
    </section>
  )
}
