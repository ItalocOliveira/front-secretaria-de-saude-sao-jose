import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import type { ReportTopOutputItem } from "@/api/reports"
import { PRINT_CHART_CLASS_NAME, PRINT_CHART_WIDTH } from "@/components/reports/print-chart"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

const CHART_CONFIG = {
  units: { label: "Unidades retiradas", color: "var(--chart-2)" },
} satisfies ChartConfig

const CHART_MARGIN = { left: 0, right: 16, top: 4, bottom: 4 }

const NAME_WIDTH = 160
const NAME_MAX_CHARS = 24

/** Cada barra ocupa ~32px; a altura acompanha a quantidade de itens (até 10). */
const heightFor = (count: number) => Math.max(count, 3) * 32 + 32

const formatName = (name: string) => (name.length > NAME_MAX_CHARS ? `${name.slice(0, NAME_MAX_CHARS - 1)}…` : name)

/**
 * Barras horizontais dos itens mais retirados no período. Carregado via `React.lazy`.
 * `variant="print"` é a cópia de tamanho fixo que vai para a folha de gráficos do PDF.
 */
export function ReportTopOutputsChart({
  items,
  variant = "screen",
}: {
  items: ReportTopOutputItem[]
  variant?: "screen" | "print"
}) {
  const height = heightFor(items.length)

  const axes = (
    <>
      <CartesianGrid horizontal={false} />
      <XAxis type="number" dataKey="units" allowDecimals={false} tickLine={false} axisLine={false} />
      <YAxis
        type="category"
        dataKey="name"
        tickLine={false}
        axisLine={false}
        width={NAME_WIDTH}
        interval={0}
        tickFormatter={formatName}
      />
    </>
  )

  if (variant === "print") {
    return (
      <div aria-hidden className={PRINT_CHART_CLASS_NAME}>
        <BarChart width={PRINT_CHART_WIDTH} height={height} data={items} layout="vertical" margin={CHART_MARGIN}>
          {axes}
          <Bar dataKey="units" fill="var(--chart-2)" radius={4} isAnimationActive={false} />
        </BarChart>
      </div>
    )
  }

  return (
    <ChartContainer config={CHART_CONFIG} className="aspect-auto w-full" style={{ height }}>
      <BarChart data={items} layout="vertical" margin={CHART_MARGIN}>
        {axes}
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar dataKey="units" fill="var(--color-units)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
