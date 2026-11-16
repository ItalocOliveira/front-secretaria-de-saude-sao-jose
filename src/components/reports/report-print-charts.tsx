import type { ReactNode } from "react"

import type { ApacsReport, ReportTopOutputItem } from "@/api/reports"
import { formatPointDate } from "@/lib/report"

/*
 * Gráficos do PDF em SVG feito à mão (sem `recharts`): tamanho fixo + `viewBox`,
 * então o navegador só escala para a largura da folha e nada depende de medir a
 * tela na hora de imprimir. Desenho aprovado em `mockups/relatorio-pdf.html`.
 */

const WIDTH = 700

const formatCount = (value: number) => value.toLocaleString("pt-BR")

/** Marcas "redondas" (passo 1, 2, 2,5 ou 5 × 10ⁿ) cobrindo o máximo, com 3 a 5 intervalos. */
function ticksFor(max: number) {
  if (max <= 5) {
    return Array.from({ length: Math.max(max, 1) + 1 }, (_, index) => index)
  }
  const rough = max / 4
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 2.5, 5, 10].map((factor) => factor * magnitude).find((value) => value >= rough) ?? rough
  const top = Math.ceil(max / step) * step
  return Array.from({ length: Math.round(top / step) + 1 }, (_, index) => index * step)
}

/** Quebra o nome em até 2 linhas para a coluna de rótulos — no papel nada é cortado sem aviso. */
function wrapLabel(text: string, maxChars = 30) {
  const lines = [""]
  for (const word of text.split(" ")) {
    const current = lines[lines.length - 1]
    const next = `${current} ${word}`.trim()
    if (next.length > maxChars && current !== "") {
      lines.push(word)
    } else {
      lines[lines.length - 1] = next
    }
  }
  if (lines.length > 2) {
    return [
      lines[0],
      `${lines
        .slice(1)
        .join(" ")
        .slice(0, maxChars - 1)}…`,
    ]
  }
  return lines
}

// Cores do SVG pelos tokens do tema (nunca valores crus).
const GRID = "var(--border)"
const AXIS_TEXT = "var(--muted-foreground)"
const INK = "var(--foreground)"

export function PrintCreatedChart({ series }: { series: ApacsReport["createdOverTime"] }) {
  const { points } = series
  const height = 250
  const pad = { top: 18, right: 10, bottom: 26, left: 34 }
  const plotW = WIDTH - pad.left - pad.right
  const plotH = height - pad.top - pad.bottom
  const ticks = ticksFor(Math.max(0, ...points.map((point) => point.count)))
  const top = ticks[ticks.length - 1]
  const x = (index: number) => pad.left + (points.length <= 1 ? plotW / 2 : (index / (points.length - 1)) * plotW)
  const y = (value: number) => pad.top + plotH - (value / top) * plotH

  // No máximo ~11 rótulos no eixo X, com o último sempre visível.
  const labelStep = Math.max(1, Math.ceil(points.length / 10))
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"}${x(index)},${y(point.count)}`).join("")
  const area = points.length > 0 ? `${path}L${x(points.length - 1)},${y(0)}L${x(0)},${y(0)}Z` : ""
  const peak = points.reduce((best, point, index) => (point.count > points[best].count ? index : best), 0)

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${height}`}
      role="img"
      aria-label="APACs criadas ao longo do tempo"
      className="block h-auto w-full overflow-visible"
    >
      {ticks.map((tick) => (
        <g key={tick}>
          <line x1={pad.left} x2={WIDTH - pad.right} y1={y(tick)} y2={y(tick)} stroke={GRID} />
          <text x={pad.left - 6} y={y(tick) + 3} textAnchor="end" fontSize={10} fill={AXIS_TEXT}>
            {formatCount(tick)}
          </text>
        </g>
      ))}
      {points.map((point, index) =>
        index % labelStep === 0 || index === points.length - 1 ? (
          <text key={point.date} x={x(index)} y={height - 8} textAnchor="middle" fontSize={10} fill={AXIS_TEXT}>
            {formatPointDate(point.date)}
          </text>
        ) : null
      )}
      <path d={area} fill="var(--chart-3)" fillOpacity={0.12} />
      {/* Linha reta entre os pontos: curva suavizada sugeriria valores que não existem. */}
      <path d={path} fill="none" stroke="var(--chart-3)" strokeWidth={2} strokeLinejoin="round" />
      {points.map((point, index) =>
        point.count > 0 ? (
          <circle
            key={point.date}
            cx={x(index)}
            cy={y(point.count)}
            r={4}
            fill="var(--background)"
            stroke="var(--chart-3)"
            strokeWidth={2}
          />
        ) : null
      )}
      {points[peak] !== undefined && points[peak].count > 0 ? (
        <text x={x(peak)} y={y(points[peak].count) - 9} textAnchor="middle" fontSize={10} fontWeight={600} fill={INK}>
          {formatCount(points[peak].count)}
        </text>
      ) : null}
    </svg>
  )
}

export function PrintTopOutputsChart({ items }: { items: ReportTopOutputItem[] }) {
  const labelW = 210
  const rowH = 30
  const barH = 16
  const pad = { top: 6, right: 40, bottom: 24 }
  const height = pad.top + items.length * rowH + pad.bottom
  const plotW = WIDTH - labelW - pad.right
  const ticks = ticksFor(Math.max(0, ...items.map((item) => item.units)))
  const top = ticks[ticks.length - 1]
  const x = (value: number) => labelW + (value / top) * plotW
  const plotBottom = pad.top + items.length * rowH

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${height}`}
      role="img"
      aria-label="Itens mais retirados no período"
      className="block h-auto w-full overflow-visible"
    >
      {ticks.map((tick) => (
        <g key={tick}>
          <line x1={x(tick)} x2={x(tick)} y1={pad.top} y2={plotBottom} stroke={GRID} />
          <text x={x(tick)} y={plotBottom + 14} textAnchor="middle" fontSize={10} fill={AXIS_TEXT}>
            {formatCount(tick)}
          </text>
        </g>
      ))}
      {items.map((item, index) => {
        const cy = pad.top + index * rowH + rowH / 2
        const lines = wrapLabel(item.name)
        const barW = Math.max(x(item.units) - labelW, 2)
        return (
          <g key={item.id}>
            {lines.map((line, lineIndex) => (
              <text
                key={lineIndex}
                x={labelW - 10}
                y={cy + 3 + (lineIndex - (lines.length - 1) / 2) * 11}
                textAnchor="end"
                fontSize={10}
                fill={INK}
              >
                {line}
              </text>
            ))}
            <rect x={labelW} y={cy - barH / 2} width={barW} height={barH} rx={4} fill="var(--chart-2)" />
            <text x={labelW + barW + 6} y={cy + 3.5} fontSize={10} fontWeight={600} fill={INK}>
              {formatCount(item.units)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/** Painel fechado e numerado de cada gráfico: o leitor sabe onde um termina e o outro começa. */
export function PrintFigure({
  number,
  title,
  description,
  stats,
  footnote,
  children,
}: {
  number: number
  title: string
  description: string
  stats: { value: string; label: string }[]
  footnote?: string
  children: ReactNode
}) {
  return (
    <figure className="m-0 break-inside-avoid overflow-hidden rounded-lg border border-border">
      <figcaption className="flex items-start justify-between gap-4 border-b border-border bg-muted px-3.5 py-2.5">
        <div>
          <div className="text-[7.5pt] font-semibold tracking-wider text-primary uppercase">Gráfico {number}</div>
          <div className="text-[10.5pt] font-semibold">{title}</div>
          <div className="text-[8pt] text-muted-foreground">{description}</div>
        </div>
        <div className="flex gap-3.5 text-right">
          {stats.map((stat) => (
            <div key={stat.label}>
              <strong className="block text-[12pt]">{stat.value}</strong>
              <span className="text-[7.5pt] text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </figcaption>
      <div className="px-3.5 pt-2.5 pb-2">{children}</div>
      {footnote ? <div className="px-3.5 pb-2.5 text-[7.5pt] text-muted-foreground">{footnote}</div> : null}
    </figure>
  )
}
