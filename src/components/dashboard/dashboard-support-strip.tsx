import { ChevronRightIcon, LifeBuoyIcon } from "lucide-react"

import type { SupportActivityDto } from "@/api/notifications"
import { describeSupportAction } from "@/lib/support"
import { Badge } from "@/components/ui/badge"

/**
 * Campo pequeno com os avisos do suporte (`support` de `GET /notifications`, só
 * `DEV`/`SECRETARIO`/`DIRETOR`): total dos últimos `days` dias + a ação mais recente. O clique leva ao
 * card de auditoria já na aba "Suporte".
 */
export function DashboardSupportStrip({ support, onOpen }: { support: SupportActivityDto; onOpen: () => void }) {
  const latest = support.items[0]

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border bg-muted/50 px-4 py-2.5 text-left text-sm outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <span className="flex items-center gap-2 font-semibold">
        <LifeBuoyIcon className="size-4" aria-hidden />
        Avisos do suporte
      </span>
      <Badge variant="secondary" className="tabular-nums">
        {support.count} nos últimos {support.days} dias
      </Badge>
      {latest === undefined ? null : (
        <span className="min-w-0 flex-1 truncate text-muted-foreground">
          Mais recente: <span className="font-medium text-foreground">{describeSupportAction(latest).title}</span>
        </span>
      )}
      <span className="ml-auto flex items-center gap-1 font-medium">
        Ver todas
        <ChevronRightIcon className="size-4" aria-hidden />
      </span>
    </button>
  )
}
