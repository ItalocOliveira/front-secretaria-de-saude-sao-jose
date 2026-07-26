import { CheckCircle2Icon, ClockIcon, FileTextIcon, SearchCheckIcon, TrendingUpIcon, XCircleIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Stat = {
  label: string
  value: number
  hint: string
  trend?: string
  icon: typeof FileTextIcon
}

// Mockado: virá de um agregado da API (`GET /apecs` + contagem por status).
const STATS: Stat[] = [
  { label: "APACs cadastradas hoje", value: 23, hint: "em relação a ontem", trend: "+12%", icon: FileTextIcon },
  { label: "Pendentes", value: 18, hint: "Aguardando ação", icon: ClockIcon },
  { label: "Em análise", value: 31, hint: "Com a regulação", icon: SearchCheckIcon },
  { label: "Aprovadas", value: 142, hint: "Este mês", icon: CheckCircle2Icon },
  { label: "Negadas", value: 7, hint: "Este mês", icon: XCircleIcon },
]

export function ApacStats() {
  return (
    <div className="grid gap-4 *:min-w-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {STATS.map((stat) => (
        <Card key={stat.label} size="sm">
          <CardHeader>
            <CardDescription>{stat.label}</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{stat.value.toString().padStart(2, "0")}</CardTitle>
            <CardAction>
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <stat.icon className="size-4" />
              </div>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-1.5">
            {stat.trend ? (
              <Badge variant="secondary">
                <TrendingUpIcon />
                {stat.trend}
              </Badge>
            ) : null}
            <span className="text-xs text-muted-foreground">{stat.hint}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
