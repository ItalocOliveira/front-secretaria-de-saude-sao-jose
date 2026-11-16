import type { ReactNode } from "react"

import type { InventoryItem } from "@/api/itens"
import type { ApacsReport, ReportInventory } from "@/api/reports"
import { useTenantName } from "@/hooks/use-tenant"
import { ITEM_STATUS, ITEM_TYPE_LIST, isLowStock } from "@/lib/itens"
import {
  acsLabel,
  destinationLabel,
  formatDifference,
  formatPointDate,
  formatReportDate,
  itemStatusLabel,
  itemTypeLabel,
  municipalityLabel,
  priorityLabel,
  procedureLabel,
  statusLabel,
  toBreakdown,
  unitsOf,
} from "@/lib/report"
import { cn } from "@/lib/utils"
import { PrintCreatedChart, PrintFigure, PrintTopOutputsChart } from "@/components/reports/report-print-charts"
import { PrintDistGroup } from "@/components/reports/report-print-table"
import { Badge } from "@/components/ui/badge"

/*
 * Documento que vira o PDF ("Exportar PDF" = impressão do navegador). Só aparece
 * na impressão; a tela tem os próprios componentes e some no papel. Desenho
 * aprovado em `mockups/relatorio-pdf.html` — mude lá primeiro e porte para cá.
 *
 * Ordem: (1) APACs, (2) almoxarifado, (3) inventário completo, (4) gráficos; cada
 * seção a partir de uma página nova.
 */

/** A partir daqui o inventário completo vira 2 colunas. */
const INVENTORY_TWO_COLUMNS_FROM = 25

const formatCount = (value: number) => value.toLocaleString("pt-BR")
const plural = (count: number, one: string, many: string) => `${formatCount(count)} ${count === 1 ? one : many}`

function Section({
  number,
  title,
  note,
  children,
}: {
  number: number
  title: string
  note?: string
  children: ReactNode
}) {
  return (
    <section className="flex break-before-page flex-col gap-3 first-of-type:break-before-auto">
      <h2 className="m-0 flex break-after-avoid items-center gap-2.5 text-[13pt] font-semibold">
        <span className="inline-grid size-5.5 place-items-center rounded-md bg-primary text-[9pt] text-primary-foreground">
          {number}
        </span>
        {title}
        {note ? <span className="ml-auto text-[8pt] font-normal text-muted-foreground">{note}</span> : null}
      </h2>
      {children}
    </section>
  )
}

function Kpis({ children }: { children: ReactNode }) {
  return (
    <div className="grid break-inside-avoid grid-cols-4 divide-x divide-border rounded-lg border border-border">
      {children}
    </div>
  )
}

function Kpi({ label, value, hint }: { label: string; value: number; hint: ReactNode }) {
  return (
    <div className="px-3 py-2">
      <div className="text-[8pt] text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-[16pt] leading-tight font-semibold tabular-nums">{formatCount(value)}</div>
      <div className="mt-0.5 text-[7.5pt] text-muted-foreground">{hint}</div>
    </div>
  )
}

function InventorySection({ inventory }: { inventory: ReportInventory }) {
  const { stock, movementsInPeriod: movements } = inventory
  const top = movements.topOutputItems

  return (
    <Section number={2} title="Almoxarifado" note="Estoque e status: situação atual · movimentações: período">
      <Kpis>
        <Kpi
          label="Itens cadastrados"
          value={stock.totalItems}
          hint={`${formatCount(stock.totalUnits)} unidades em estoque`}
        />
        <Kpi
          label="Estoque baixo"
          value={stock.lowStockCount}
          hint={stock.lowStockCount > 0 ? <Badge variant="destructive">Requer reposição</Badge> : "Nenhum item"}
        />
        <Kpi
          label="Entradas no período"
          value={movements.entries.units}
          hint={`unidades em ${plural(movements.entries.count, "movimentação", "movimentações")}`}
        />
        <Kpi
          label="Saídas no período"
          value={movements.outputs.units}
          hint={`unidades em ${plural(movements.outputs.count, "movimentação", "movimentações")} · saldo ${formatDifference(movements.balance)}`}
        />
      </Kpis>

      <PrintDistGroup
        tables={[
          {
            title: "Estoque por tipo",
            description: "Unidades em estoque hoje",
            entries: toBreakdown(unitsOf(stock.byType), itemTypeLabel),
            unit: "Unid.",
            emptyText: "Nenhuma unidade em estoque.",
          },
          {
            title: "Status dos itens",
            description: "Itens cadastrados, situação atual",
            entries: toBreakdown(stock.byStatus, itemStatusLabel),
            unit: "Itens",
            emptyText: "Nenhum item cadastrado.",
          },
          {
            title: "Saídas por destino",
            description: "Unidades retiradas no período, pelo destino informado",
            entries: toBreakdown(unitsOf(movements.outputsByDestination), destinationLabel),
            unit: "Unid.",
            emptyText: "Nenhuma saída no período.",
          },
        ]}
      />

      {/* No máximo 10 linhas: cabe sempre numa página, então nunca é partida. */}
      <table className="w-full border-separate border-spacing-0 break-inside-avoid rounded-lg border border-border text-[8.5pt]">
        <thead>
          <tr>
            <th colSpan={4} className="px-2.5 pt-2 pb-0.5 text-left text-[9.5pt] font-semibold">
              Itens mais retirados
              <span className="block text-[7.5pt] font-normal text-muted-foreground">
                Até 10 itens com mais unidades retiradas no período
              </span>
            </th>
          </tr>
          <tr className="text-[7.5pt] text-muted-foreground">
            <th className="border-b border-border px-2.5 py-1 text-left font-medium">Item</th>
            <th className="border-b border-border px-2.5 py-1 text-left font-medium">Tipo</th>
            <th className="border-b border-border px-2.5 py-1 text-right font-medium">Retirado no período</th>
            <th className="border-b border-border px-2.5 py-1 text-right font-medium">Estoque atual</th>
          </tr>
        </thead>
        <tbody>
          {top.length === 0 ? (
            <tr>
              <td colSpan={4} className="p-2.5 text-center text-muted-foreground">
                Nenhuma saída no período.
              </td>
            </tr>
          ) : (
            top.map((item) => (
              <tr key={item.id} className="[&+tr>td]:border-t [&+tr>td]:border-muted">
                <td className="px-2.5 py-1">{item.name}</td>
                <td className="px-2.5 py-1">{itemTypeLabel(item.type)}</td>
                <td className="px-2.5 py-1 text-right tabular-nums">{formatCount(item.units)}</td>
                <td className="px-2.5 py-1 text-right tabular-nums">{formatCount(item.amount)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </Section>
  )
}

const NAME_COLLATOR = new Intl.Collator("pt-BR", { sensitivity: "base", numeric: true })

function InventoryListSection({ items }: { items: InventoryItem[] }) {
  const totalUnits = items.reduce((sum, item) => sum + item.amount, 0)
  const order = (type: string) => {
    const index = (ITEM_TYPE_LIST as string[]).indexOf(type)
    return index === -1 ? ITEM_TYPE_LIST.length : index
  }
  const groups = [...new Set(items.map((item) => item.type))]
    .sort((a, b) => order(a) - order(b) || a.localeCompare(b))
    .map((type) => {
      const list = items.filter((item) => item.type === type).sort((a, b) => NAME_COLLATOR.compare(a.name, b.name))
      return { type, list, units: list.reduce((sum, item) => sum + item.amount, 0) }
    })

  return (
    <Section
      number={3}
      title="Inventário completo"
      note={`${plural(items.length, "item", "itens")} · ${formatCount(totalUnits)} unidades em estoque hoje`}
    >
      {items.length === 0 ? (
        <p className="m-0 text-muted-foreground">Nenhum item cadastrado no almoxarifado.</p>
      ) : (
        <>
          <div className="flex items-center gap-3 text-[7.5pt] text-muted-foreground">
            <span>Quantidade atual à direita</span>
            <span className="flex items-center gap-1">
              <Badge variant="destructive">Baixo</Badge> abaixo do mínimo
            </span>
            <span className="flex items-center gap-1">
              <Badge variant="outline">Emprestado</Badge> status do item
            </span>
          </div>
          <div className={cn("gap-4.5", items.length >= INVENTORY_TWO_COLUMNS_FROM && "columns-2")}>
            {groups.map((group) => (
              <div key={group.type} className="mb-2.5">
                <div className="flex break-inside-avoid break-after-avoid justify-between gap-2 rounded-md bg-muted px-2 py-0.5 text-[8.5pt] font-semibold">
                  {itemTypeLabel(group.type)}
                  <span className="font-normal text-muted-foreground">
                    {plural(group.list.length, "item", "itens")} · {formatCount(group.units)} un.
                  </span>
                </div>
                {group.list.map((item) => (
                  <div
                    key={item.id}
                    className="flex break-inside-avoid items-baseline gap-1.5 border-b border-muted px-2 py-0.5 text-[8pt]"
                  >
                    <span className="min-w-0 flex-1">{item.name}</span>
                    {item.status === ITEM_STATUS.EMPRESTADO ? <Badge variant="outline">Emprestado</Badge> : null}
                    {isLowStock(item) ? <Badge variant="destructive">Baixo</Badge> : null}
                    <span className="tabular-nums">{formatCount(item.amount)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </Section>
  )
}

export function ReportPrintDocument({
  report,
  inventoryItems,
  title,
  generatedAt,
}: {
  report: ApacsReport
  /** Todas as páginas de `GET /itens`; só existe quando há `report.inventory`. */
  inventoryItems: InventoryItem[] | undefined
  title: string
  generatedAt: string
}) {
  const tenantName = useTenantName()
  const { inventory, comparisonWithPreviousPeriod: comparison, createdOverTime: series } = report
  const period = `${formatReportDate(report.period.startDate)} a ${formatReportDate(report.period.endDate)}`
  const urgent = report.pendingQueue.byPriority.URGENTE ?? 0
  const peak = series.points.reduce<{ date: string; count: number } | undefined>(
    (best, point) => (best === undefined || point.count > best.count ? point : best),
    undefined
  )
  const activeBuckets = series.points.filter((point) => point.count > 0).length
  const isWeekly = series.interval === "week"
  const sectionNumber = inventory ? 4 : 2
  const top = inventory?.movementsInPeriod.topOutputItems ?? []

  return (
    <div className="hidden bg-background text-[10pt] leading-snug text-foreground print:block">
      {/* Rodapé de cada página (margin boxes do @page, Chrome 131+). Só dígitos e "/" no período. */}
      <style>{`@page {
        @bottom-left { content: "${title} · ${period}"; font: 7.5pt "Inter Variable", sans-serif; color: var(--muted-foreground); }
        @bottom-right { content: "Página " counter(page) " de " counter(pages); font: 7.5pt "Inter Variable", sans-serif; color: var(--muted-foreground); }
      }`}</style>

      <header className="mb-4.5 flex items-end justify-between gap-4 border-b-2 border-primary pb-2.5">
        <div>
          <div className="text-[8pt] tracking-wider text-muted-foreground uppercase">
            ICOS{tenantName ? ` · Secretaria de Saúde de ${tenantName}` : ""}
          </div>
          <h1 className="m-0 mt-0.5 text-[17pt] leading-tight font-semibold">{title}</h1>
        </div>
        <dl className="m-0 grid grid-cols-[auto_auto] gap-x-2.5 gap-y-px text-right text-[8.5pt]">
          <dt className="text-muted-foreground">Período</dt>
          <dd className="m-0 font-medium">{period}</dd>
          <dt className="text-muted-foreground">Gráfico agrupado por</dt>
          <dd className="m-0 font-medium">{isWeekly ? "semana" : "dia"}</dd>
          <dt className="text-muted-foreground">Gerado em</dt>
          <dd className="m-0 font-medium">{generatedAt}</dd>
        </dl>
      </header>

      <Section number={1} title="APACs" note="Contagens do período, exceto onde indicado">
        <Kpis>
          <Kpi
            label="Criadas no período"
            value={report.totalCreatedINperiod}
            hint={
              <>
                <Badge variant="outline">{formatDifference(comparison.difference)}</Badge> vs. período anterior
              </>
            }
          />
          <Kpi
            label="Período anterior"
            value={comparison.previousTotal}
            hint={`${formatReportDate(comparison.previousPeriod.startDate)} a ${formatReportDate(comparison.previousPeriod.endDate)}`}
          />
          <Kpi label="Fila de pendentes" value={report.pendingQueue.total} hint="Situação atual" />
          <Kpi
            label="Urgentes na fila"
            value={urgent}
            hint={urgent > 0 ? <Badge variant="destructive">Requer atenção</Badge> : "Nenhuma urgente"}
          />
        </Kpis>

        <PrintDistGroup
          tables={[
            {
              title: "Status no período",
              description: "Situação atual das APACs criadas no período",
              entries: toBreakdown(report.countByStatusInPeriod, statusLabel),
            },
            {
              title: "Status geral",
              description: "Todas as APACs do sistema, sem filtro de data",
              entries: toBreakdown(report.countByStatus, statusLabel),
            },
            {
              title: "Prioridade",
              description: "APACs criadas no período",
              entries: toBreakdown(report.countByPriorityInPeriod, priorityLabel),
            },
            {
              title: "Município",
              description: "APACs criadas no período",
              entries: toBreakdown(report.countByMunicipalityInPeriod, municipalityLabel),
            },
            {
              title: "Agente Comunitário de Saúde",
              description: "APACs criadas no período",
              entries: toBreakdown(report.countByAcsInPeriod, acsLabel),
            },
            {
              title: "Procedimento",
              description: "APACs criadas no período",
              entries: toBreakdown(report.countByProcedureInPeriod, procedureLabel),
              // Lista que mais cresce: folha própria, 30 por folha, nada encostado na borda.
              ownSheet: true,
            },
          ]}
        />
      </Section>

      {inventory ? <InventorySection inventory={inventory} /> : null}
      {inventory && inventoryItems ? <InventoryListSection items={inventoryItems} /> : null}

      <Section number={sectionNumber} title="Gráficos">
        <div className="flex flex-col gap-4">
          <PrintFigure
            number={1}
            title="APACs criadas ao longo do tempo"
            description={`${isWeekly ? "Total por semana (a partir de segunda-feira)" : "Total por dia"} · eixo vertical: quantidade de APACs`}
            stats={[
              { value: formatCount(report.totalCreatedINperiod), label: "no período" },
              {
                value: formatCount(peak?.count ?? 0),
                label: peak && peak.count > 0 ? `pico em ${formatPointDate(peak.date)}` : "pico",
              },
              { value: formatCount(activeBuckets), label: isWeekly ? "semanas com APAC" : "dias com APAC" },
            ]}
            footnote={`${isWeekly ? "Semanas" : "Dias"} sem APAC aparecem na linha de base (0).`}
          >
            <PrintCreatedChart series={series} />
          </PrintFigure>

          {inventory ? (
            <PrintFigure
              number={2}
              title="Almoxarifado — itens mais retirados"
              description="Unidades retiradas no período, por item"
              stats={[
                { value: formatCount(inventory.movementsInPeriod.outputs.units), label: "unidades retiradas" },
                { value: formatCount(top.length), label: top.length === 1 ? "item" : "itens" },
              ]}
            >
              {top.length === 0 ? (
                <p className="my-4 text-center text-muted-foreground">Nenhuma saída registrada no período.</p>
              ) : (
                <PrintTopOutputsChart items={top} />
              )}
            </PrintFigure>
          ) : null}
        </div>
      </Section>
    </div>
  )
}
