import { CheckCircle2Icon, ClockIcon, FileTextIcon, SearchCheckIcon, XCircleIcon } from "lucide-react"

import type { Apac } from "@/api/apacs"
import { APAC_STATUS, type ApacStatus } from "@/lib/apac"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

type Stat = {
  label: string
  hint: string
  icon: typeof FileTextIcon
  /** Ausente = total geral. */
  status?: ApacStatus
}

/**
 * A API não tem endpoint de agregação, então os números são contados sobre a
 * lista já carregada. Se a listagem ganhar paginação no servidor, estes cards
 * passam a mostrar só a página atual — aí será preciso um `GET /apecs/stats`.
 */
const STATS: Stat[] = [
  { label: "Total de APACs", hint: "Cadastradas na base", icon: FileTextIcon },
  { label: "Pendentes", hint: "Aguardando ação", icon: ClockIcon, status: APAC_STATUS.PENDENTE },
  { label: "Em análise", hint: "Com a regulação", icon: SearchCheckIcon, status: APAC_STATUS.AGUARDO },
  { label: "Aprovadas", hint: "Liberadas", icon: CheckCircle2Icon, status: APAC_STATUS.APROVADO },
  { label: "Negadas", hint: "Recusadas", icon: XCircleIcon, status: APAC_STATUS.NEGADO },
]

export function ApacStats({ apacs, isPending }: { apacs: Apac[]; isPending: boolean }) {
  return (
    <div className="grid gap-4 *:min-w-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {STATS.map((stat) => {
        const value =
          stat.status === undefined ? apacs.length : apacs.filter((apac) => apac.status === stat.status).length

        return (
          <Card key={stat.label} size="sm">
            <CardHeader>
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {isPending ? <Skeleton className="h-7 w-10" /> : value.toString().padStart(2, "0")}
              </CardTitle>
              <CardAction>
                <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <stat.icon className="size-4" />
                </div>
              </CardAction>
            </CardHeader>
            <CardContent>
              <span className="text-xs text-muted-foreground">{stat.hint}</span>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
