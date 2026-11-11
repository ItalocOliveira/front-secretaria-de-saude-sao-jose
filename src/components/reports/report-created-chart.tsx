import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import type { ApacsReport } from "@/api/reports"
import { formatPointDate } from "@/lib/report"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

const CHART_CONFIG = {
  count: { label: "APACs criadas", color: "var(--chart-3)" },
} satisfies ChartConfig

const CHART_MARGIN = { left: 0, right: 12, top: 8 }

/**
 * Tamanho fixo da versão impressa (≈ largura útil de um A4 em retrato). O SVG tem
 * `viewBox`, então o CSS só escala para a largura real da folha. Como o gráfico
 * tem uma página só dele no PDF, é mais alto que na tela (≈ 12 cm na folha).
 */
const PRINT_WIDTH = 720
const PRINT_HEIGHT = 480

const formatTick = (date: string) => formatPointDate(date)

/** Carregado via `React.lazy` — `recharts` é pesado e só esta tela usa. */
export function ReportCreatedChart({ series }: { series: ApacsReport["createdOverTime"] }) {
  const isWeekly = series.interval === "week"
  const showDots = series.points.length <= 31

  return (
    <>
      <ChartContainer config={CHART_CONFIG} className="aspect-auto h-72 w-full print:hidden">
        <LineChart data={series.points} margin={CHART_MARGIN}>
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

      {/*
        Cópia só para o PDF. O `ResponsiveContainer` do `ChartContainer` mede a tela
        por ResizeObserver e embrulha o gráfico numa div de tamanho 0 — na impressão
        ele não remede a tempo (e esticar via CSS zera o gráfico). Com tamanho fixo e
        sem animação, o SVG já está pronto quando o navegador monta a página.
      */}
      <div
        aria-hidden
        className="hidden text-xs print:block [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border [&_.recharts-surface]:h-auto [&_.recharts-surface]:w-full [&_.recharts-wrapper]:h-auto! [&_.recharts-wrapper]:w-full!"
      >
        <LineChart width={PRINT_WIDTH} height={PRINT_HEIGHT} data={series.points} margin={CHART_MARGIN}>
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
    </>
  )
}
