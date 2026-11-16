import { Pie, PieChart } from "recharts"

import type { ApacStatus } from "@/lib/apac"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

export type StatusSlice = { status: ApacStatus; label: string; count: number; fill: string }

/** Pizza em rosca com o total no centro. Só na tela, carregada via `React.lazy`. */
export function DashboardStatusChart({ slices, total }: { slices: StatusSlice[]; total: number }) {
  const config = Object.fromEntries(
    slices.map((slice) => [slice.status, { label: slice.label, color: slice.fill }])
  ) satisfies ChartConfig

  return (
    <ChartContainer config={config} className="relative aspect-square h-52 w-52 shrink-0">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="status" hideLabel />} />
        <Pie
          data={slices}
          dataKey="count"
          nameKey="status"
          innerRadius="62%"
          outerRadius="100%"
          stroke="var(--card)"
          strokeWidth={2}
          isAnimationActive={false}
        />
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
          <tspan x="50%" dy="-0.3em" className="fill-foreground text-2xl font-bold tabular-nums">
            {total.toLocaleString("pt-BR")}
          </tspan>
          <tspan x="50%" dy="1.6em" className="fill-muted-foreground text-xs">
            APACs
          </tspan>
        </text>
      </PieChart>
    </ChartContainer>
  )
}
