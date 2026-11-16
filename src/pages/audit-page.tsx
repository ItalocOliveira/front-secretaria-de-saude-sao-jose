import { useState } from "react"
import { HistoryIcon, RefreshCwIcon, XIcon } from "lucide-react"

import type { ActivityLogUser } from "@/api/activity-logs"
import {
  ACTIVITY_ACTION_LIST,
  ACTIVITY_ACTION_META,
  ACTIVITY_AREA_LABEL,
  isActivityAction,
  type ActivityArea,
} from "@/lib/activity"
import { useActivityLogs } from "@/hooks/use-activity-logs"
import { ActivityLogList } from "@/components/audit/activity-log-list"
import { AppHeader } from "@/components/layout/app-header"
import { ListPagination } from "@/components/list-pagination"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

const PAGE_SIZE = 20
const ALL = "__all__"

const SKELETON_ROWS = Array.from({ length: 6 }, (_, index) => index)

/** Ações agrupadas por área para o filtro, na ordem de `ACTIVITY_ACTION_META`. */
const AREAS = Object.keys(ACTIVITY_AREA_LABEL) as ActivityArea[]
const ACTIONS_BY_AREA = AREAS.map((area) => ({
  area,
  actions: ACTIVITY_ACTION_LIST.filter((action) => ACTIVITY_ACTION_META[action].area === area),
}))

function actionLabel(action: string) {
  if (action === ALL) {
    return "Todas as ações"
  }
  if (!isActivityAction(action)) {
    return action
  }
  const { label, area } = ACTIVITY_ACTION_META[action]
  return area === "suporte" ? `${label} (suporte)` : label
}

/**
 * Registro de atividade do município (`GET /activity-logs`), mais recentes primeiro — só
 * `SECRETARIO`/`DIRETOR` (`AUDIT_ROLES`). Filtros vão para a API: ação (`action`) e pessoa (`userId`,
 * escolhida clicando no nome de quem fez). Não filtre no array carregado: ele é só uma página.
 */
export function AuditPage() {
  const [page, setPage] = useState(1)
  const [action, setAction] = useState(ALL)
  const [user, setUser] = useState<ActivityLogUser | null>(null)

  const { data, isPending, isFetching, refetch, error } = useActivityLogs({
    page,
    pageSize: PAGE_SIZE,
    action: action === ALL ? undefined : action,
    userId: user?.id,
  })
  const logs = data?.data

  // Filtro novo volta para a página 1 (a atual pode nem existir no resultado novo).
  const changeAction = (next: string | null) => {
    setAction(next ?? ALL)
    setPage(1)
  }
  const changeUser = (next: ActivityLogUser | null) => {
    setUser(next)
    setPage(1)
  }

  const filtered = action !== ALL || user !== null

  return (
    <>
      <AppHeader section="Auditoria" />

      <div className="flex flex-1 flex-col gap-6 p-4 md:p-7">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-[1.625rem] leading-tight font-bold tracking-tight">Auditoria</h1>
          <p className="text-muted-foreground">
            Quem fez o quê neste município: acessos, APACs, ofícios, almoxarifado e ações do suporte.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Registro de atividade</CardTitle>
            <CardDescription>
              {data === undefined
                ? "Mais recentes primeiro"
                : `${data.pagination.total.toLocaleString("pt-BR")} ${data.pagination.total === 1 ? "registro" : "registros"} · mais recentes primeiro`}
            </CardDescription>
            <CardAction>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Atualizar"
                disabled={isFetching}
                onClick={() => void refetch()}
              >
                <RefreshCwIcon />
              </Button>
            </CardAction>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <Select value={action} onValueChange={changeAction}>
                <SelectTrigger aria-label="Ação" className="w-full sm:w-64">
                  <SelectValue>{(value: string) => actionLabel(value)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value={ALL}>Todas as ações</SelectItem>
                  </SelectGroup>
                  {ACTIONS_BY_AREA.map(({ area, actions }) => (
                    <SelectGroup key={area}>
                      <SelectLabel>{ACTIVITY_AREA_LABEL[area]}</SelectLabel>
                      {actions.map((item) => (
                        <SelectItem key={item} value={item}>
                          {ACTIVITY_ACTION_META[item].label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>

              {user === null ? (
                <span className="text-sm text-muted-foreground">
                  Clique no nome de alguém para ver só as ações dele.
                </span>
              ) : (
                <Badge variant="secondary" className="h-8 gap-1.5 pr-1 text-sm">
                  Só {user.name}
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Remover filtro de ${user.name}`}
                    onClick={() => changeUser(null)}
                  >
                    <XIcon />
                  </Button>
                </Badge>
              )}

              {filtered ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={() => {
                    changeAction(ALL)
                    changeUser(null)
                  }}
                >
                  Limpar filtros
                </Button>
              ) : null}
            </div>

            {error !== null && logs === undefined ? (
              <Alert variant="destructive">
                <AlertTitle>Não foi possível carregar a auditoria</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            ) : isPending || logs === undefined ? (
              <div className="flex flex-col gap-2">
                {SKELETON_ROWS.map((row) => (
                  <Skeleton key={row} className="h-16 w-full" />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <Empty className="border border-dashed p-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <HistoryIcon />
                  </EmptyMedia>
                  <EmptyTitle>Nenhum registro</EmptyTitle>
                  <EmptyDescription>
                    {filtered ? "Nada corresponde aos filtros escolhidos." : "Ainda não há atividade registrada."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ActivityLogList logs={logs} onUserClick={changeUser} />
            )}
          </CardContent>

          {data === undefined || data.pagination.total === 0 ? null : (
            <CardFooter>
              <ListPagination pagination={data.pagination} label="registros de atividade" onPageChange={setPage} />
            </CardFooter>
          )}
        </Card>
      </div>
    </>
  )
}
