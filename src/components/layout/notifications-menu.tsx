import { useNavigate } from "react-router"
import { formatDistanceToNowStrict } from "date-fns"
import { ptBR } from "date-fns/locale"
import { BellIcon, BellOffIcon, PackageIcon, SignalHighIcon } from "lucide-react"

import type { LowStockItemDto, UrgentApacDto } from "@/api/notifications"
import { APAC_PROCEDURE_LABEL, APAC_STATUS_LABEL, type ApacProcedure } from "@/lib/apac"
import type { ApacsLocationState } from "@/lib/apac-filters"
import type { ItensLocationState } from "@/lib/itens"
import { useNotifications } from "@/hooks/use-notifications"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"

const MAX_BADGE = 99

function formatBadge(total: number) {
  return total > MAX_BADGE ? `${MAX_BADGE}+` : String(total)
}

/** "há 2 dias" — `created_at` é ISO em UTC; data inválida vira string vazia. */
function waitingFor(createdAt: string) {
  const date = new Date(createdAt)
  return Number.isNaN(date.getTime()) ? "" : formatDistanceToNowStrict(date, { locale: ptBR, addSuffix: true })
}

/** A API manda a chave do enum; uma chave que o front ainda não conhece aparece crua em vez de sumir. */
function procedureLabel(procedure: string) {
  return APAC_PROCEDURE_LABEL[procedure as ApacProcedure] ?? procedure
}

const SKELETON_ROWS = 3

/**
 * Sino do header (`GET /notifications`): itens com estoque abaixo do mínimo e APACs urgentes ainda
 * na fila. Não há "marcar como lida" — o alerta some sozinho quando o problema é resolvido. Some
 * para quem não tem acesso à rota (`RECEPCIONISTA` recebe `403`).
 */
export function NotificationsMenu() {
  const navigate = useNavigate()
  const { data, isPending, error, enabled } = useNotifications()

  if (!enabled) {
    return null
  }

  const total = data?.total ?? 0
  const label = total === 0 ? "Notificações" : `Notificações: ${total} ${total === 1 ? "alerta" : "alertas"}`

  const openItem = (item: LowStockItemDto) => {
    const state: ItensLocationState = { search: item.name, itemId: item.id }
    void navigate("/almoxarifado", { state })
  }

  const openApac = (apac: UrgentApacDto) => {
    // Nome do paciente vai no `state`, não na URL.
    const state: ApacsLocationState = { search: apac.name, priority: "URGENTE", status: apac.status, apacId: apac.id }
    void navigate("/apacs", { state })
  }

  const openAllApacs = () => {
    // A listagem aceita um `status` por vez: abre no primeiro da fila (hoje `PENDENTE`).
    const state: ApacsLocationState = { priority: "URGENTE", status: data?.urgentApacs.statuses[0] ?? "PENDENTE" }
    void navigate("/apacs", { state })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="relative" aria-label={label}>
            <BellIcon />
            {total > 0 ? (
              <Badge variant="destructive" className="absolute -top-0.5 -right-1 px-1 tabular-nums">
                {formatBadge(total)}
              </Badge>
            ) : null}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-[min(22rem,calc(100vw-2rem))]">
        {isPending ? (
          <DropdownMenuGroup>
            <DropdownMenuLabel>Carregando alertas…</DropdownMenuLabel>
            <div className="flex flex-col gap-2 p-1.5">
              {Array.from({ length: SKELETON_ROWS }, (_, index) => (
                <Skeleton key={index} className="h-9 w-full" />
              ))}
            </div>
          </DropdownMenuGroup>
        ) : error !== null && data === undefined ? (
          <DropdownMenuGroup>
            <DropdownMenuLabel>Não foi possível carregar os alertas</DropdownMenuLabel>
            <p className="px-1.5 pb-1.5 text-sm text-muted-foreground">{error.message}</p>
          </DropdownMenuGroup>
        ) : data === undefined || data.total === 0 ? (
          <Empty className="p-6">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BellOffIcon />
              </EmptyMedia>
              <EmptyTitle>Nenhum alerta</EmptyTitle>
              <EmptyDescription>Estoque acima do mínimo e nenhuma APAC urgente na fila.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {data.lowStock.count > 0 ? (
              <DropdownMenuGroup>
                <DropdownMenuLabel>Estoque baixo · {data.lowStock.count}</DropdownMenuLabel>
                {data.lowStock.items.map((item) => (
                  <DropdownMenuItem key={item.id} className="items-start" onClick={() => openItem(item)}>
                    <PackageIcon className="mt-0.5 text-muted-foreground" />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-medium">{item.name}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {item.amount} em estoque (mínimo {item.min_amount})
                      </span>
                    </span>
                  </DropdownMenuItem>
                ))}
                {data.lowStock.count > data.lowStock.items.length ? (
                  <DropdownMenuItem
                    className="justify-center text-muted-foreground"
                    onClick={() => navigate("/almoxarifado")}
                  >
                    Ver almoxarifado ({data.lowStock.count} itens)
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuGroup>
            ) : null}

            {data.lowStock.count > 0 && data.urgentApacs.count > 0 ? <DropdownMenuSeparator /> : null}

            {data.urgentApacs.count > 0 ? (
              <DropdownMenuGroup>
                <DropdownMenuLabel>APACs urgentes na fila · {data.urgentApacs.count}</DropdownMenuLabel>
                {data.urgentApacs.items.map((apac) => (
                  <DropdownMenuItem key={apac.id} className="items-start" onClick={() => openApac(apac)}>
                    <SignalHighIcon className="mt-0.5 text-destructive" />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-medium">
                        <span className="text-muted-foreground tabular-nums">#{apac.protocol_number}</span> ·{" "}
                        {apac.name}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">{procedureLabel(apac.procedure)}</span>
                      <span className="text-xs text-muted-foreground">
                        {APAC_STATUS_LABEL[apac.status] ?? apac.status} {waitingFor(apac.created_at)}
                      </span>
                    </span>
                  </DropdownMenuItem>
                ))}
                {data.urgentApacs.count > data.urgentApacs.items.length ? (
                  <DropdownMenuItem className="justify-center text-muted-foreground" onClick={openAllApacs}>
                    Ver todas ({data.urgentApacs.count} APACs)
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuGroup>
            ) : null}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
