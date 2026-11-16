import { Link } from "react-router"
import { HistoryIcon, LifeBuoyIcon } from "lucide-react"

import type { SupportActivityDto } from "@/api/notifications"
import { AUDIT_TAB, type AuditTab } from "@/lib/dashboard"
import { useActivityLogs } from "@/hooks/use-activity-logs"
import { ActivityLogList } from "@/components/audit/activity-log-list"
import { SupportActivityList } from "@/components/dashboard/support-activity-list"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const DESCRIPTION: Record<AuditTab, string> = {
  municipio: "Quem fez o quê neste município — as ações mais recentes.",
  suporte: "Alterações feitas pela equipe da plataforma neste município.",
}

/** Últimas ações no card; o histórico completo, com filtros, fica em `/auditoria`. */
const RECENT_LOGS = { pageSize: 6 }

const SKELETON_ROWS = Array.from({ length: 3 }, (_, index) => index)

/**
 * Auditoria do município — só `SECRETARIO`/`DIRETOR` (`canSeeAudit`); a página nem renderiza o card
 * para os outros. Duas abas:
 * - **Município**: últimas ações de `GET /activity-logs` (comunicado 2026-11-16-auditoria-municipio).
 * - **Suporte**: `support` do `GET /notifications` (ações da plataforma nos últimos 30 dias). Sem
 *   `support` (`null`), a aba não aparece.
 */
export function DashboardAuditCard({
  support,
  tab,
  onTabChange,
}: {
  /** `null`/`undefined` = perfil sem acesso às ações do suporte (ou ainda carregando). */
  support: SupportActivityDto | null | undefined
  tab: AuditTab
  onTabChange: (tab: AuditTab) => void
}) {
  const hasSupport = support !== null && support !== undefined
  const current = hasSupport ? tab : AUDIT_TAB.MUNICIPIO
  const logs = useActivityLogs(RECENT_LOGS)

  return (
    <Card>
      <Tabs value={current} onValueChange={(value) => onTabChange(value as AuditTab)}>
        <CardHeader>
          <CardTitle>Auditoria</CardTitle>
          <CardDescription>{DESCRIPTION[current]}</CardDescription>
          <CardAction>
            <TabsList>
              <TabsTrigger value={AUDIT_TAB.MUNICIPIO}>Município</TabsTrigger>
              {hasSupport ? (
                <TabsTrigger value={AUDIT_TAB.SUPORTE}>
                  Suporte
                  <Badge variant="secondary" className="tabular-nums">
                    {support.count}
                  </Badge>
                </TabsTrigger>
              ) : null}
            </TabsList>
          </CardAction>
        </CardHeader>

        <CardContent className="pt-4">
          <TabsContent value={AUDIT_TAB.MUNICIPIO}>
            {logs.error !== null && logs.data === undefined ? (
              <Alert variant="destructive">
                <AlertTitle>Não foi possível carregar a auditoria</AlertTitle>
                <AlertDescription>{logs.error.message}</AlertDescription>
              </Alert>
            ) : logs.data === undefined ? (
              <div className="flex flex-col gap-2">
                {SKELETON_ROWS.map((row) => (
                  <Skeleton key={row} className="h-14 w-full" />
                ))}
              </div>
            ) : logs.data.data.length === 0 ? (
              <Empty className="p-6">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <HistoryIcon />
                  </EmptyMedia>
                  <EmptyTitle>Nenhuma atividade registrada</EmptyTitle>
                  <EmptyDescription>As ações dos usuários do município aparecem aqui.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ActivityLogList logs={logs.data.data} />
            )}
          </TabsContent>

          {hasSupport ? (
            <TabsContent value={AUDIT_TAB.SUPORTE}>
              {support.items.length === 0 ? (
                <Empty className="p-6">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <LifeBuoyIcon />
                    </EmptyMedia>
                    <EmptyTitle>Nenhuma ação do suporte</EmptyTitle>
                    <EmptyDescription>
                      Nada foi alterado pela equipe da plataforma nos últimos {support.days} dias.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <SupportActivityList items={support.items} />
              )}
            </TabsContent>
          ) : null}
        </CardContent>

        {current === AUDIT_TAB.MUNICIPIO && logs.data !== undefined && logs.data.pagination.total > 0 ? (
          <CardFooter className="justify-between gap-2 text-[0.8125rem] text-muted-foreground">
            <span>
              Mostrando {logs.data.data.length} de {logs.data.pagination.total.toLocaleString("pt-BR")}
            </span>
            <Link to="/auditoria" className="font-medium text-muted-foreground hover:text-foreground hover:underline">
              Ver registro completo
            </Link>
          </CardFooter>
        ) : null}
      </Tabs>
    </Card>
  )
}
