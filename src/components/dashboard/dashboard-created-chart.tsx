import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import type { ApacsReport } from "@/api/reports"
import { formatPointDate } from "@/lib/report"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

const CHART_CONFIG = {
  count: { label: "APACs cadastradas", color: "var(--sidebar-primary)" },
} satisfies ChartConfig

const CHART_MARGIN = { left: 0, right: 4, top: 8 }
const BAR_RADIUS: [number, number, number, number] = [4, 4, 0, 0]

/** `date` = "YYYY-MM-DD" já no fuso local: o eixo mostra só o dia. */
const formatDay = (date: string) => String(Number(date.slice(8, 10)))

/** Barras por dia do mês (uma série → sem legenda). Só na tela, carregado via `React.lazy`. */
export function DashboardCreatedChart({ points }: { points: ApacsReport["createdOverTime"]["points"] }) {
  return (
    <ChartContainer config={CHART_CONFIG} className="aspect-auto h-56 w-full">
      <BarChart data={points} margin={CHART_MARGIN} barCategoryGap={2}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={8}
          tickFormatter={formatDay}
        />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                const date = payload[0]?.payload?.date as string | undefined
                return date === undefined ? null : formatPointDate(date, true)
              }}
            />
          }
        />
        <Bar dataKey="count" fill="var(--color-count)" radius={BAR_RADIUS} />
      </BarChart>
    </ChartContainer>
  )
}
