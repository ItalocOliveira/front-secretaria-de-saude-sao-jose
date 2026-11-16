import { HistoryIcon, LifeBuoyIcon } from "lucide-react"

import type { SupportActivityDto } from "@/api/notifications"
import { AUDIT_TAB, type AuditTab } from "@/lib/dashboard"
import { SupportActivityList } from "@/components/dashboard/support-activity-list"
import { Badge } from "@/components/ui/badge"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const DESCRIPTION: Record<AuditTab, string> = {
  municipio: "Quem fez o quê neste município.",
  suporte: "Alterações feitas pela equipe da plataforma neste município.",
}

/**
 * Auditoria do município, em duas abas:
 * - **Município** (todos os perfis do dashboard): registro de atividade dos próprios usuários
 *   (`APAC_PDF_VIEWED`, `USER_CREATED` com `source: "MUNICIPIO"`…). A API grava, mas ainda **não
 *   tem rota de leitura** para o front — a aba mostra o aviso até ela existir.
 * - **Suporte** (só `SECRETARIO`/`DIRETOR`, que recebem `support` no `GET /notifications`): ações da
 *   plataforma. Sem `support` (`null`), a aba nem aparece.
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
            <Empty className="border border-dashed p-6">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <HistoryIcon />
                </EmptyMedia>
                <EmptyTitle>Registro de atividade em breve</EmptyTitle>
                <EmptyDescription>
                  A API já registra quem abriu PDFs de APAC e quem criou usuários, mas ainda não disponibiliza esse
                  histórico para consulta. Ele aparece aqui assim que a rota for publicada.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
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
      </Tabs>
    </Card>
  )
}
