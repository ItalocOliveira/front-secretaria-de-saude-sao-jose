import type { BreakdownEntry } from "@/lib/report"
import { cn } from "@/lib/utils"

/** Até aqui a tabela é "curta": nunca é partida e fica lado a lado com outra. */
const SHORT_ROWS = 8

const PERCENT = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 })

export type PrintDistTableProps = {
  title: string
  description: string
  entries: BreakdownEntry[]
  /** Cabeçalho da coluna numérica. */
  unit?: string
  emptyText?: string
}

const isShort = (table: PrintDistTableProps) => table.entries.length <= SHORT_ROWS

/*
 * Tabela simples (e não `@/components/ui/table`): o `Table` do shadcn embrulha em
 * `overflow-x-auto`, e o PDF precisa que a tabela possa continuar na página seguinte
 * repetindo o `<thead>` — título incluso — sem nada cortado.
 */
export function PrintDistTable({
  title,
  description,
  entries,
  unit = "Qtd.",
  emptyText = "Sem dados no período.",
}: PrintDistTableProps) {
  const total = entries.reduce((sum, entry) => sum + entry.count, 0)

  return (
    <table
      className={cn(
        "w-full border-separate border-spacing-0 rounded-lg border border-border text-[8.5pt]",
        entries.length <= SHORT_ROWS && "break-inside-avoid"
      )}
    >
      <thead>
        <tr>
          <th colSpan={3} className="px-2.5 pt-2 pb-0.5 text-left align-top text-[9.5pt] font-semibold">
            {title}
            <span className="block text-[7.5pt] font-normal text-muted-foreground">{description}</span>
          </th>
        </tr>
        <tr className="text-[7.5pt] text-muted-foreground">
          <th className="border-b border-border px-2.5 py-1 text-left font-medium">Descrição</th>
          <th className="w-px border-b border-border px-2.5 py-1 text-right font-medium whitespace-nowrap">{unit}</th>
          <th className="w-[30%] border-b border-border px-2.5 py-1 text-left font-medium">Participação</th>
        </tr>
      </thead>
      <tbody>
        {entries.length === 0 ? (
          <tr>
            <td colSpan={3} className="p-2.5 text-center text-muted-foreground">
              {emptyText}
            </td>
          </tr>
        ) : (
          entries.map((entry) => {
            const percent = total === 0 ? 0 : (entry.count / total) * 100
            return (
              <tr key={entry.key} className="break-inside-avoid [&+tr>td]:border-t [&+tr>td]:border-muted">
                <td className="px-2.5 py-1 align-top">{entry.label}</td>
                <td className="px-2.5 py-1 text-right align-top whitespace-nowrap tabular-nums">
                  {entry.count.toLocaleString("pt-BR")}
                </td>
                <td className="px-2.5 py-1 align-top">
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.25 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="w-9 text-right text-[7.5pt] text-muted-foreground tabular-nums">
                      {PERCENT.format(percent)}%
                    </span>
                  </div>
                </td>
              </tr>
            )
          })
        )}
        {/* Total como última linha (e não `<tfoot>`): o Chrome repete o `tfoot` em toda página. */}
        {entries.length > 1 ? (
          <tr className="break-inside-avoid font-semibold">
            <td className="border-t border-border px-2.5 py-1">Total</td>
            <td className="border-t border-border px-2.5 py-1 text-right tabular-nums">
              {total.toLocaleString("pt-BR")}
            </td>
            <td className="border-t border-border" />
          </tr>
        ) : null}
      </tbody>
    </table>
  )
}

/** Curtas em pares (2 colunas), longas em largura total — na ordem recebida. */
export function PrintDistGroup({ tables }: { tables: PrintDistTableProps[] }) {
  const blocks: PrintDistTableProps[][] = []
  for (const table of tables) {
    const last = blocks[blocks.length - 1]
    if (isShort(table) && last !== undefined && last.length === 1 && isShort(last[0])) {
      last.push(table)
    } else {
      blocks.push([table])
    }
  }

  return blocks.map((block) =>
    block.length === 2 || isShort(block[0]) ? (
      <div key={block[0].title} className="grid grid-cols-2 items-start gap-3">
        {block.map((table) => (
          <PrintDistTable key={table.title} {...table} />
        ))}
      </div>
    ) : (
      <PrintDistTable key={block[0].title} {...block[0]} />
    )
  )
}
