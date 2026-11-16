import { lazy, Suspense } from "react"
import { PackageOpenIcon } from "lucide-react"

import type { ReportTopOutputItem } from "@/api/reports"
import { itemTypeLabel } from "@/lib/report"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const ReportTopOutputsChart = lazy(() =>
  import("@/components/reports/report-top-outputs-chart").then((module) => ({
    default: module.ReportTopOutputsChart,
  }))
)

const CHART_FALLBACK = <Skeleton className="h-56 w-full" />

const SKELETON_ROWS = Array.from({ length: 4 }, (_, index) => index)

/** Itens mais retirados: gráfico só na tela (no PDF ele vai para a folha de gráficos) + tabela com os números. */
export function ReportTopOutputsCard({ items }: { items: ReportTopOutputItem[] | undefined }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Itens mais retirados</CardTitle>
        <CardDescription>Até 10 itens com mais unidades retiradas no período</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {items === undefined ? (
          SKELETON_ROWS.map((row) => <Skeleton key={row} className="h-8 w-full" />)
        ) : items.length === 0 ? (
          <Empty className="p-4">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PackageOpenIcon />
              </EmptyMedia>
              <EmptyTitle>Sem dados</EmptyTitle>
              <EmptyDescription>Nenhuma saída registrada no período.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <div className="print:hidden">
              <Suspense fallback={CHART_FALLBACK}>
                <ReportTopOutputsChart items={items} />
              </Suspense>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Retirado no período</TableHead>
                  <TableHead className="text-right">Estoque atual</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} className="break-inside-avoid">
                    <TableCell className="max-w-64 truncate font-medium" title={item.name}>
                      {item.name}
                    </TableCell>
                    <TableCell>{itemTypeLabel(item.type)}</TableCell>
                    <TableCell className="text-right tabular-nums">{item.units.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-right tabular-nums">{item.amount.toLocaleString("pt-BR")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  )
}
