import { Link } from "react-router"
import { formatDistanceToNowStrict } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CircleCheckIcon, SignalHighIcon } from "lucide-react"

import type { NotificationsDto, UrgentApacDto } from "@/api/notifications"
import { APAC_PROCEDURE_LABEL, APAC_STATUS_BADGE, APAC_STATUS_LABEL, type ApacProcedure } from "@/lib/apac"
import type { ApacsLocationState } from "@/lib/apac-filters"
import { Badge } from "@/components/ui/badge"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { Skeleton } from "@/components/ui/skeleton"

/** Quantas aparecem no card — a API manda até 10. */
const VISIBLE = 4

const SKELETON_ROWS = Array.from({ length: 3 }, (_, index) => index)

function waitingFor(createdAt: string) {
  const date = new Date(createdAt)
  return Number.isNaN(date.getTime()) ? "" : formatDistanceToNowStrict(date, { locale: ptBR, addSuffix: true })
}

/** Chave que o front ainda não conhece aparece crua em vez de sumir. */
function procedureLabel(procedure: string) {
  return APAC_PROCEDURE_LABEL[procedure as ApacProcedure] ?? procedure
}

function stateFor(apac: UrgentApacDto): ApacsLocationState {
  // Nome do paciente vai no `state`, nunca na URL.
  return { search: apac.name, priority: "URGENTE", status: apac.status, apacId: apac.id }
}

/** `urgentApacs` de `GET /notifications`: APACs urgentes ainda na fila, as mais antigas primeiro. */
export function DashboardUrgentCard({ urgent }: { urgent: NotificationsDto["urgentApacs"] | undefined }) {
  const items = urgent?.items.slice(0, VISIBLE) ?? []
  const allState: ApacsLocationState = { priority: "URGENTE", status: urgent?.statuses[0] ?? "PENDENTE" }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Urgentes na fila</CardTitle>
        <CardDescription>
          {urgent === undefined ? "Carregando…" : `${urgent.count} APACs urgentes pendentes ou em análise`}
        </CardDescription>
        <CardAction>
          <Link
            to="/apacs"
            state={allState}
            className="text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
          >
            Ver todas
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        {urgent === undefined ? (
          <div className="flex flex-col gap-2">
            {SKELETON_ROWS.map((row) => (
              <Skeleton key={row} className="h-14 w-full" />
            ))}
          </div>
        ) : urgent.count === 0 ? (
          <Empty className="p-4">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CircleCheckIcon />
              </EmptyMedia>
              <EmptyTitle>Nenhuma urgente na fila</EmptyTitle>
              <EmptyDescription>Todas as APACs urgentes já foram analisadas.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ItemGroup className="gap-2">
            {items.map((apac) => (
              <Item key={apac.id} variant="muted" size="sm" render={<Link to="/apacs" state={stateFor(apac)} />}>
                <ItemMedia variant="icon" className="text-destructive">
                  <SignalHighIcon />
                </ItemMedia>
                <ItemContent className="min-w-0">
                  <ItemTitle className="w-full truncate">{apac.name}</ItemTitle>
                  <ItemDescription className="truncate">
                    {procedureLabel(apac.procedure)} · {waitingFor(apac.created_at)}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Badge variant={APAC_STATUS_BADGE[apac.status] ?? "default"}>
                    {APAC_STATUS_LABEL[apac.status] ?? apac.status}
                  </Badge>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        )}
      </CardContent>
      {urgent !== undefined && urgent.count > items.length ? (
        <CardFooter className="text-[0.8125rem] text-muted-foreground">
          Mostrando {items.length} de {urgent.count} · mais antigas primeiro
        </CardFooter>
      ) : null}
    </Card>
  )
}
