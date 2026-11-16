import type { BreakdownEntry } from "@/lib/report"
import { cn } from "@/lib/utils"

/** Até aqui a tabela é "curta": nunca é partida e fica lado a lado com outra. */
const SHORT_ROWS = 8

/**
 * Tabela em folha própria (Procedimento) é fatiada em blocos deste tamanho, cada um
 * no topo de uma folha nova: nenhuma linha encosta na borda nem é partida pelo navegador.
 */
const ROWS_PER_SHEET = 30

const PERCENT = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 })

export type PrintDistTableProps = {
  title: string
  description: string
  entries: BreakdownEntry[]
  /** Cabeçalho da coluna numérica. */
  unit?: string
  emptyText?: string
  /** Começa numa folha nova e é fatiada em `ROWS_PER_SHEET` linhas por folha. */
  ownSheet?: boolean
}

type SliceInfo = {
  /** Total da tabela inteira (o percentual é sobre ele, não sobre a fatia). */
  total: number
  /** Posição da fatia: "Linhas 31–60 de 61" e "(continuação)" nas seguintes. */
  from: number
  to: number
  count: number
  isLast: boolean
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
  slice,
}: Omit<PrintDistTableProps, "ownSheet"> & { slice?: SliceInfo }) {
  const total = slice?.total ?? entries.reduce((sum, entry) => sum + entry.count, 0)
  const showTotal = slice ? slice.isLast && slice.count > 1 : entries.length > 1

  return (
    <table
      className={cn(
        "w-full border-separate border-spacing-0 rounded-lg border border-border text-[8.5pt]",
        // Nunca é partida: se não cabe, desce inteira. Maior que uma folha o navegador
        // parte mesmo assim — por isso a tabela em folha própria é fatiada.
        "break-inside-avoid"
      )}
    >
      <thead>
        <tr>
          <th colSpan={3} className="px-2.5 pt-2 pb-0.5 text-left align-top text-[9.5pt] font-semibold">
            {title}
            {slice !== undefined && slice.from > 1 ? (
              <span className="font-normal text-muted-foreground"> (continuação)</span>
            ) : null}
            <span className="block text-[7.5pt] font-normal text-muted-foreground">
              {description}
              {slice !== undefined && slice.count > ROWS_PER_SHEET
                ? ` · linhas ${slice.from}–${slice.to} de ${slice.count}`
                : ""}
            </span>
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
        {showTotal ? (
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

/** Tabela em folha(s) própria(s): cada fatia de `ROWS_PER_SHEET` linhas no topo de uma folha. */
function PrintSheetTable({ entries, title, description, unit, emptyText }: PrintDistTableProps) {
  const total = entries.reduce((sum, entry) => sum + entry.count, 0)
  const slices =
    entries.length === 0
      ? [[]]
      : Array.from({ length: Math.ceil(entries.length / ROWS_PER_SHEET) }, (_, index) =>
          entries.slice(index * ROWS_PER_SHEET, (index + 1) * ROWS_PER_SHEET)
        )

  return slices.map((slice, index) => (
    <div key={index} className="break-before-page">
      <PrintDistTable
        title={title}
        description={description}
        unit={unit}
        emptyText={emptyText}
        entries={slice}
        slice={{
          total,
          from: index * ROWS_PER_SHEET + 1,
          to: index * ROWS_PER_SHEET + slice.length,
          count: entries.length,
          isLast: index === slices.length - 1,
        }}
      />
    </div>
  ))
}

/**
 * Curtas em pares (2 colunas), longas em largura total, `ownSheet` em folha(s)
 * própria(s) — na ordem recebida.
 */
export function PrintDistGroup({ tables }: { tables: PrintDistTableProps[] }) {
  const blocks: PrintDistTableProps[][] = []
  for (const table of tables) {
    const last = blocks[blocks.length - 1]
    if (table.ownSheet) {
      blocks.push([table])
    } else if (isShort(table) && last !== undefined && last.length === 1 && isShort(last[0]) && !last[0].ownSheet) {
      last.push(table)
    } else {
      blocks.push([table])
    }
  }

  return blocks.map((block) =>
    block[0].ownSheet ? (
      <PrintSheetTable key={block[0].title} {...block[0]} />
    ) : block.length === 2 || isShort(block[0]) ? (
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
