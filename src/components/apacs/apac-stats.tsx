import { APAC_STATUS, type ApacStatus } from "@/lib/apac"
import { ALL } from "@/lib/apac-filters"
import { Skeleton } from "@/components/ui/skeleton"

type Stat = {
  label: string
  /** `ALL` = total geral (e limpa o filtro de status). */
  status: ApacStatus | typeof ALL
}

/**
 * Os números vêm de `countByStatus` do `POST /reports/apacs` (toda a base do município, sem
 * filtro de data) — a listagem é paginada, então contar a página carregada estaria errado.
 */
const STATS: Stat[] = [
  { label: "Total", status: ALL },
  { label: "Pendentes", status: APAC_STATUS.PENDENTE },
  { label: "Em análise", status: APAC_STATUS.AGUARDO },
  { label: "Aprovadas", status: APAC_STATUS.APROVADO },
  { label: "Negadas", status: APAC_STATUS.NEGADO },
  { label: "Entregues", status: APAC_STATUS.ENTREGUE },
]

/** Cada card é também o filtro de status da tabela: um clique em vez de abrir um select. */
export function ApacStats({
  countByStatus,
  isPending,
  activeStatus,
  onStatusChange,
}: {
  /** Chaves com 0 não vêm da API — ausência conta como 0. */
  countByStatus: Record<string, number> | undefined
  isPending: boolean
  activeStatus: ApacStatus | typeof ALL
  onStatusChange: (status: ApacStatus | typeof ALL) => void
}) {
  return (
    <section aria-label="Resumo por status" className="grid grid-cols-2 gap-3 *:min-w-0 sm:grid-cols-3 xl:grid-cols-6">
      {STATS.map((stat) => {
        const value =
          stat.status === ALL
            ? Object.values(countByStatus ?? {}).reduce((sum, count) => sum + count, 0)
            : (countByStatus?.[stat.status] ?? 0)
        const pressed = activeStatus === stat.status

        return (
          <button
            key={stat.label}
            type="button"
            aria-pressed={pressed}
            onClick={() => onStatusChange(pressed ? ALL : stat.status)}
            className="flex flex-col gap-1.5 rounded-xl bg-card px-4 pt-3.5 pb-4 text-left text-card-foreground ring-1 ring-foreground/10 transition-colors outline-none hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-pressed:bg-primary/10 aria-pressed:ring-2 aria-pressed:ring-primary"
          >
            <span className="text-[0.8125rem] font-medium text-muted-foreground">{stat.label}</span>
            {isPending ? (
              <Skeleton className="h-7.5 w-10" />
            ) : (
              <span className="text-3xl leading-none font-bold tracking-tight tabular-nums">{value}</span>
            )}
          </button>
        )
      })}
    </section>
  )
}
