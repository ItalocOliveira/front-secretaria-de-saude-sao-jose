import { PackageOpenIcon } from "lucide-react"

import type { ReportInventory } from "@/api/reports"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"

const VISIBLE = 5
const SIGNED = new Intl.NumberFormat("pt-BR", { signDisplay: "exceptZero" })

function Total({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col rounded-lg bg-muted px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold tabular-nums">{value}</span>
    </div>
  )
}

/**
 * Movimentação do almoxarifado no mês (`inventory.movementsInPeriod` do relatório): totais e os itens
 * mais retirados. Barras em HTML puro — com 5 linhas, não vale baixar o `recharts` por isso.
 */
export function DashboardInventoryCard({ inventory }: { inventory: ReportInventory | undefined }) {
  const movements = inventory?.movementsInPeriod
  const top = movements?.topOutputItems.slice(0, VISIBLE) ?? []
  const max = top[0]?.units ?? 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Almoxarifado no mês</CardTitle>
        <CardDescription>Entradas, saídas e os itens mais retirados</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {movements === undefined ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              <Total label="Entradas" value={SIGNED.format(movements.entries.units)} />
              <Total label="Saídas" value={SIGNED.format(-movements.outputs.units)} />
              <Total label="Saldo" value={SIGNED.format(movements.balance)} />
            </div>

            {top.length === 0 ? (
              <Empty className="p-4">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <PackageOpenIcon />
                  </EmptyMedia>
                  <EmptyTitle>Sem saídas no mês</EmptyTitle>
                  <EmptyDescription>Nenhum item foi retirado do almoxarifado ainda.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ul className="flex flex-col gap-2" aria-label="Itens mais retirados no mês">
                {top.map((item) => (
                  <li
                    key={item.id}
                    className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)_auto] items-center gap-3 text-sm"
                  >
                    <span className="truncate" title={item.name}>
                      {item.name}
                    </span>
                    <span className="h-2 rounded-r-sm bg-muted" aria-hidden>
                      <span
                        className="block h-full rounded-r-sm bg-primary"
                        style={{ width: `${max === 0 ? 0 : (item.units / max) * 100}%` }}
                      />
                    </span>
                    <span className="font-semibold tabular-nums">{item.units.toLocaleString("pt-BR")}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
