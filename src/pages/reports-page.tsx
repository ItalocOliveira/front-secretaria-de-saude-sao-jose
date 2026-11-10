import { lazy, Suspense, useState } from "react"
import type { DateRange } from "react-day-picker"
import { FileDownIcon, RotateCcwIcon } from "lucide-react"

import type { ReportInterval } from "@/api/reports"
import { useApacsReport } from "@/hooks/use-reports"
import { printPage } from "@/lib/print"
import {
  acsLabel,
  buildReportRequest,
  formatReportDate,
  municipalityLabel,
  priorityLabel,
  procedureLabel,
  statusLabel,
  toBreakdown,
} from "@/lib/report"
import { DateRangePicker } from "@/components/apacs/date-range-picker"
import { AppHeader } from "@/components/layout/app-header"
import { ReportBreakdownCard } from "@/components/reports/report-breakdown-card"
import { ReportSummaryCards } from "@/components/reports/report-summary-cards"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

// `recharts` é pesado: só baixa quando a tela de relatórios abre.
const ReportCreatedChart = lazy(() =>
  import("@/components/reports/report-created-chart").then((module) => ({ default: module.ReportCreatedChart }))
)

const CHART_FALLBACK = <Skeleton className="h-72 w-full" />

const INTERVAL_LABEL: Record<ReportInterval, string> = { day: "dia", week: "semana" }

const GENERATED_AT_FORMAT = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" })

export function ReportsPage() {
  const [period, setPeriod] = useState<DateRange | undefined>(undefined)
  const [interval, setReportInterval] = useState<ReportInterval>("day")

  const { data: report, isPending, isFetching, error } = useApacsReport(buildReportRequest(period, interval))

  const periodText =
    report === undefined
      ? null
      : `${formatReportDate(report.period.startDate)} a ${formatReportDate(report.period.endDate)}`

  const exportPdf = () => {
    if (periodText === null) {
      return
    }
    // Nome sugerido do arquivo: sem "/" (vira separador de pasta em alguns sistemas).
    printPage(`Relatório de APACs - ${periodText.replaceAll("/", "-")}`)
  }

  const breakdown = (counts: Record<string, number> | undefined, label: (key: string) => string) =>
    counts === undefined ? [] : toBreakdown(counts, label)

  return (
    <>
      <AppHeader section="Relatórios" />

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-xl font-medium">
              Relatórios<span className="hidden print:inline"> de APACs</span>
            </h1>
            <p className="text-sm text-muted-foreground print:hidden">Indicadores de criação de APACs por período.</p>
            {/* Os filtros não vão para o PDF; este resumo substitui eles no papel. */}
            <p className="hidden text-sm text-muted-foreground print:block">
              Período: {periodText} · Gráfico agrupado por {INTERVAL_LABEL[interval]} · Gerado em{" "}
              {GENERATED_AT_FORMAT.format(new Date())}
            </p>
          </div>

          <Button
            variant="outline"
            className="print:hidden"
            disabled={report === undefined || isFetching}
            onClick={exportPdf}
          >
            <FileDownIcon data-icon="inline-start" />
            Exportar PDF
          </Button>
        </div>

        <Card className="print:hidden">
          <CardContent>
            <FieldGroup className="grid gap-4 sm:grid-cols-[minmax(0,20rem)_auto]">
              <Field>
                <FieldLabel htmlFor="report-period">Período</FieldLabel>
                <DateRangePicker id="report-period" value={period} onValueChange={setPeriod} />
              </Field>

              <Field>
                <FieldLabel>Agrupar gráfico por</FieldLabel>
                <ToggleGroup
                  variant="outline"
                  spacing={0}
                  value={[interval]}
                  onValueChange={(values: string[]) => {
                    // Toggle group permite desmarcar tudo; o intervalo é sempre obrigatório.
                    const next = values[0]
                    if (next === "day" || next === "week") {
                      setReportInterval(next)
                    }
                  }}
                >
                  <ToggleGroupItem value="day">Dia</ToggleGroupItem>
                  <ToggleGroupItem value="week">Semana</ToggleGroupItem>
                </ToggleGroup>
              </Field>
            </FieldGroup>
          </CardContent>

          <CardFooter className="justify-between gap-2">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              {periodText === null
                ? "Carregando período..."
                : `${period === undefined ? "Mês atual" : "Período"}: ${periodText}`}
              {isFetching ? <Spinner /> : null}
            </span>
            <Button variant="ghost" size="sm" disabled={period === undefined} onClick={() => setPeriod(undefined)}>
              <RotateCcwIcon data-icon="inline-start" />
              Mês atual
            </Button>
          </CardFooter>
        </Card>

        {error ? (
          <Alert variant="destructive" className="print:hidden">
            <AlertTitle>Não foi possível gerar o relatório</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        ) : null}

        <ReportSummaryCards report={report} isPending={isPending} />

        <Card className="print:break-inside-avoid">
          <CardHeader>
            <CardTitle>APACs criadas ao longo do tempo</CardTitle>
            <CardDescription>
              {interval === "week" ? "Total por semana (a partir de segunda-feira)" : "Total por dia"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {report === undefined ? (
              CHART_FALLBACK
            ) : (
              <Suspense fallback={CHART_FALLBACK}>
                <ReportCreatedChart series={report.createdOverTime} />
              </Suspense>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 *:min-w-0 lg:grid-cols-2 print:grid-cols-2">
          <ReportBreakdownCard
            title="Status no período"
            description="Situação atual das APACs criadas no período"
            entries={breakdown(report?.countByStatusInPeriod, statusLabel)}
            isPending={isPending}
          />
          <ReportBreakdownCard
            title="Status geral"
            description="Todas as APACs do sistema, sem filtro de data"
            entries={breakdown(report?.countByStatus, statusLabel)}
            isPending={isPending}
          />
          <ReportBreakdownCard
            title="Prioridade"
            description="APACs criadas no período"
            entries={breakdown(report?.countByPriorityInPeriod, priorityLabel)}
            isPending={isPending}
          />
          <ReportBreakdownCard
            title="Município"
            description="APACs criadas no período"
            entries={breakdown(report?.countByMunicipalityInPeriod, municipalityLabel)}
            isPending={isPending}
          />
          <ReportBreakdownCard
            title="Procedimento"
            description="APACs criadas no período"
            entries={breakdown(report?.countByProcedureInPeriod, procedureLabel)}
            isPending={isPending}
          />
          <ReportBreakdownCard
            title="Agente Comunitário de Saúde"
            description="APACs criadas no período"
            entries={breakdown(report?.countByAcsInPeriod, acsLabel)}
            isPending={isPending}
          />
        </div>
      </div>
    </>
  )
}
