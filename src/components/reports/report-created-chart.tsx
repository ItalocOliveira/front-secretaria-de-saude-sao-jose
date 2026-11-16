import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import type { ApacsReport } from "@/api/reports"
import { formatPointDate } from "@/lib/report"
import { PRINT_CHART_CLASS_NAME, PRINT_CHART_WIDTH } from "@/components/reports/print-chart"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

const CHART_CONFIG = {
  count: { label: "APACs criadas", color: "var(--chart-3)" },
} satisfies ChartConfig

const CHART_MARGIN = { left: 0, right: 12, top: 8 }

/** Altura da versão impressa — divide a folha de gráficos com o do almoxarifado. */
const PRINT_HEIGHT = 380

const formatTick = (date: string) => formatPointDate(date)

/**
 * Carregado via `React.lazy` — `recharts` é pesado e só esta tela usa.
 * `variant="print"` é a cópia de tamanho fixo que vai para a folha de gráficos do PDF.
 */
export function ReportCreatedChart({
  series,
  variant = "screen",
}: {
  series: ApacsReport["createdOverTime"]
  variant?: "screen" | "print"
}) {
  const isWeekly = series.interval === "week"
  const showDots = series.points.length <= 31

  const axes = (
    <>
      <CartesianGrid vertical={false} />
      <XAxis
        dataKey="date"
        tickLine={false}
        axisLine={false}
        tickMargin={8}
        minTickGap={24}
        tickFormatter={formatTick}
      />
      <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
    </>
  )

  if (variant === "print") {
    return (
      <div aria-hidden className={PRINT_CHART_CLASS_NAME}>
        <LineChart width={PRINT_CHART_WIDTH} height={PRINT_HEIGHT} data={series.points} margin={CHART_MARGIN}>
          {axes}
          <Line
            dataKey="count"
            type="monotone"
            stroke="var(--chart-3)"
            strokeWidth={2}
            dot={showDots}
            isAnimationActive={false}
          />
        </LineChart>
      </div>
    )
  }

  return (
    <ChartContainer config={CHART_CONFIG} className="aspect-auto h-72 w-full">
      <LineChart data={series.points} margin={CHART_MARGIN}>
        {axes}
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                const date = payload[0]?.payload?.date as string | undefined
                if (date === undefined) {
                  return null
                }
                return isWeekly ? `Semana de ${formatPointDate(date, true)}` : formatPointDate(date, true)
              }}
            />
          }
        />
        <Line dataKey="count" type="monotone" stroke="var(--color-count)" strokeWidth={2} dot={showDots} />
      </LineChart>
    </ChartContainer>
  )
}
