import { useState } from "react"
import { ChartNoAxesColumnIcon } from "lucide-react"

import type { BreakdownEntry } from "@/lib/report"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"

const COLLAPSED_LIMIT = 6

const SKELETON_ROWS = Array.from({ length: 4 }, (_, index) => index)

export function ReportBreakdownCard({
  title,
  description,
  entries,
  isPending,
}: {
  title: string
  description: string
  entries: BreakdownEntry[]
  isPending: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  const total = entries.reduce((sum, entry) => sum + entry.count, 0)
  const hiddenCount = entries.length - COLLAPSED_LIMIT

  return (
    <Card className="print:break-inside-avoid">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {isPending ? (
          SKELETON_ROWS.map((row) => <Skeleton key={row} className="h-8 w-full" />)
        ) : entries.length === 0 ? (
          <Empty className="p-4">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ChartNoAxesColumnIcon />
              </EmptyMedia>
              <EmptyTitle>Sem dados</EmptyTitle>
              <EmptyDescription>Nenhuma APAC criada no período.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          entries.map((entry, index) => (
            // Recolhido só na tela: no PDF a lista sai completa.
            <Progress
              key={entry.key}
              value={total === 0 ? 0 : (entry.count / total) * 100}
              className={cn(!expanded && index >= COLLAPSED_LIMIT && "hidden print:flex")}
            >
              <ProgressLabel className="min-w-0 flex-1 truncate" title={entry.label}>
                {entry.label}
              </ProgressLabel>
              <ProgressValue className="tabular-nums">{() => entry.count.toLocaleString("pt-BR")}</ProgressValue>
            </Progress>
          ))
        )}
      </CardContent>

      {!isPending && hiddenCount > 0 ? (
        <CardFooter className="print:hidden">
          <Button variant="ghost" size="sm" onClick={() => setExpanded((value) => !value)}>
            {expanded ? "Mostrar menos" : `Ver todos (+${hiddenCount})`}
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  )
}
