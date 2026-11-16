/**
 * Versão impressa dos gráficos do relatório.
 *
 * O `ResponsiveContainer` do `ChartContainer` mede a tela por ResizeObserver e
 * embrulha o gráfico numa div de tamanho 0 — na impressão ele não remede a tempo
 * (e esticar via CSS zera o gráfico). Por isso o PDF usa cópias de tamanho fixo e
 * sem animação: o SVG já está pronto quando o navegador monta a página, e como
 * tem `viewBox` o CSS só escala para a largura real da folha.
 */

/** ≈ largura útil de um A4 em retrato. */
export const PRINT_CHART_WIDTH = 720

/** Cores dos eixos/grade pelos tokens do tema e SVG escalado para a largura da folha. */
export const PRINT_CHART_CLASS_NAME =
  "text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border [&_.recharts-surface]:h-auto [&_.recharts-surface]:w-full [&_.recharts-wrapper]:h-auto! [&_.recharts-wrapper]:w-full!"
