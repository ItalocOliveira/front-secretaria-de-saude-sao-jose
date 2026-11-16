import { lazy, Suspense, useState } from "react"
import type { DateRange } from "react-day-picker"
import { FileDownIcon, RotateCcwIcon } from "lucide-react"

import type { ReportInterval } from "@/api/reports"
import { useAllItens } from "@/hooks/use-itens"
import { useApacsReport } from "@/hooks/use-reports"
import { useSession } from "@/hooks/use-session"
import { canAccessItens } from "@/lib/permissions"
import { printPage } from "@/lib/print"
import {
  REPORT_MAX_DAYS,
  acsLabel,
  buildReportRequest,
  destinationLabel,
  formatReportDate,
  itemStatusLabel,
  itemTypeLabel,
  municipalityLabel,
  priorityLabel,
  procedureLabel,
  statusLabel,
  toBreakdown,
  unitsOf,
} from "@/lib/report"
import { DateRangePicker } from "@/components/apacs/date-range-picker"
import { AppHeader } from "@/components/layout/app-header"
import { ReportBreakdownCard } from "@/components/reports/report-breakdown-card"
import { ReportInventoryListCard } from "@/components/reports/report-inventory-list-card"
import { ReportPrintDocument } from "@/components/reports/report-print-document"
import { ReportInventorySummaryCards } from "@/components/reports/report-inventory-summary-cards"
import { ReportSummaryCards } from "@/components/reports/report-summary-cards"
import { ReportTopOutputsCard } from "@/components/reports/report-top-outputs-card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

// `recharts` é pesado: só baixa quando a tela de relatórios abre.
const ReportCreatedChart = lazy(() =>
  import("@/components/reports/report-created-chart").then((module) => ({ default: module.ReportCreatedChart }))
)

const CHART_FALLBACK = <Skeleton className="h-72 w-full" />

const GENERATED_AT_FORMAT = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" })

/*
 * Tela e PDF são árvores separadas: tudo o que está aqui some na impressão
 * (`print:hidden`) e o papel mostra só o `ReportPrintDocument` — APACs,
 * almoxarifado, inventário completo e gráficos, cada um a partir de uma página nova.
 */
export function ReportsPage() {
  const [period, setPeriod] = useState<DateRange | undefined>(undefined)
  const [interval, setReportInterval] = useState<ReportInterval>("day")
  const { claims } = useSession()

  const { data: report, isPending, isFetching, error } = useApacsReport(buildReportRequest(period, interval))

  // Quem diz se há seção é a API (`inventory: null`); o perfil só decide o esqueleto do carregamento.
  const inventory = report === undefined ? undefined : report.inventory
  const showInventory =
    inventory === undefined ? isPending && claims !== null && canAccessItens(claims.role) : inventory !== null

  // Inventário completo: só quem recebe a seção do almoxarifado; não depende do período.
  const allItens = useAllItens(showInventory)

  const periodText =
    report === undefined
      ? null
      : `${formatReportDate(report.period.startDate)} a ${formatReportDate(report.period.endDate)}`

  const reportTitle = inventory ? "Relatório de APACs e almoxarifado" : "Relatório de APACs"

  const exportPdf = () => {
    if (periodText === null) {
      return
    }
    // Nome sugerido do arquivo: sem "/" (vira separador de pasta em alguns sistemas).
    printPage(`${reportTitle} - ${periodText.replaceAll("/", "-")}`)
  }

  const breakdown = (counts: Record<string, number> | undefined, label: (key: string) => string) =>
    counts === undefined ? [] : toBreakdown(counts, label)

  return (
    <>
      <AppHeader section="Relatórios" />

      <div className="flex flex-1 flex-col gap-4 p-4 print:hidden">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-xl font-medium">Relatórios</h1>
            <p className="text-sm text-muted-foreground">
              Indicadores de APACs{showInventory ? " e do almoxarifado" : ""} por período.
            </p>
          </div>

          <Button
            variant="outline"
            disabled={report === undefined || isFetching || (inventory ? allItens.isPending : false)}
            onClick={exportPdf}
          >
            <FileDownIcon data-icon="inline-start" />
            Exportar PDF
          </Button>
        </div>

        <Card>
          <CardContent>
            <FieldGroup className="grid gap-4 sm:grid-cols-[minmax(0,20rem)_auto]">
              <Field>
                <FieldLabel htmlFor="report-period">Período</FieldLabel>
                <DateRangePicker
                  id="report-period"
                  value={period}
                  onValueChange={setPeriod}
                  maxDays={REPORT_MAX_DAYS}
                />
                <FieldDescription>Até {REPORT_MAX_DAYS} dias.</FieldDescription>
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
          <Alert variant="destructive">
            <AlertTitle>Não foi possível gerar o relatório</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        ) : null}

        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-lg font-medium">APACs</h2>

          <ReportSummaryCards report={report} isPending={isPending} />

          <Card>
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

          <div className="grid gap-4 *:min-w-0 lg:grid-cols-2">
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
        </section>

        {showInventory ? (
          // No PDF o almoxarifado começa numa página nova, separado das APACs.
          <section className="flex flex-col gap-4 pt-4">
            <div className="flex flex-col gap-1">
              <h2 className="font-heading text-lg font-medium">Almoxarifado</h2>
              <p className="text-sm text-muted-foreground">
                Estoque e status refletem a situação atual; entradas, saídas e destinos são do período.
              </p>
            </div>

            <ReportInventorySummaryCards inventory={inventory ?? undefined} />

            <div className="grid gap-4 *:min-w-0 lg:grid-cols-2">
              <ReportBreakdownCard
                title="Estoque por tipo"
                description="Unidades em estoque hoje"
                entries={breakdown(inventory ? unitsOf(inventory.stock.byType) : undefined, itemTypeLabel)}
                isPending={inventory === undefined}
                emptyDescription="Nenhuma unidade em estoque."
              />
              <ReportBreakdownCard
                title="Status dos itens"
                description="Quantidade de itens cadastrados, situação atual"
                entries={breakdown(inventory?.stock.byStatus, itemStatusLabel)}
                isPending={inventory === undefined}
                emptyDescription="Nenhum item cadastrado."
              />
              <ReportBreakdownCard
                title="Saídas por destino"
                description="Unidades retiradas no período, pelo destino informado"
                entries={breakdown(
                  inventory ? unitsOf(inventory.movementsInPeriod.outputsByDestination) : undefined,
                  destinationLabel
                )}
                isPending={inventory === undefined}
                emptyDescription="Nenhuma saída registrada no período."
              />
            </div>

            <ReportTopOutputsCard items={inventory?.movementsInPeriod.topOutputItems} />
          </section>
        ) : null}

        {showInventory ? (
          <section className="flex flex-col gap-4">
            <ReportInventoryListCard items={allItens.data} isPending={allItens.isPending} error={allItens.error} />
          </section>
        ) : null}
      </div>

      {report === undefined ? null : (
        <ReportPrintDocument
          report={report}
          inventoryItems={allItens.data}
          title={reportTitle}
          generatedAt={GENERATED_AT_FORMAT.format(new Date())}
        />
      )}
    </>
  )
}
