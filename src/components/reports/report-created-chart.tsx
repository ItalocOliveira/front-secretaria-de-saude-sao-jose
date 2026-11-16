import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import type { ApacsReport } from "@/api/reports"
import { formatPointDate } from "@/lib/report"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

const CHART_CONFIG = {
  count: { label: "APACs criadas", color: "var(--chart-3)" },
} satisfies ChartConfig

const CHART_MARGIN = { left: 0, right: 12, top: 8 }

const formatTick = (date: string) => formatPointDate(date)

/** Só na tela, carregado via `React.lazy`. O PDF usa o SVG de `report-print-charts.tsx`. */
export function ReportCreatedChart({ series }: { series: ApacsReport["createdOverTime"] }) {
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
