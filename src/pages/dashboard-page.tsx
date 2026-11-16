import { useRef, useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { AUDIT_TAB, greetingFor, type AuditTab } from "@/lib/dashboard"
import { useNotifications } from "@/hooks/use-notifications"
import { useApacsReport } from "@/hooks/use-reports"
import { useTenantName } from "@/hooks/use-tenant"
import { ApacFormSheet } from "@/components/apacs/apac-form-sheet"
import { DashboardAuditCard } from "@/components/dashboard/dashboard-audit-card"
import { DashboardCreatedCard } from "@/components/dashboard/dashboard-created-card"
import { DashboardInventoryCard } from "@/components/dashboard/dashboard-inventory-card"
import { DashboardKpis } from "@/components/dashboard/dashboard-kpis"
import { DashboardLowStockCard } from "@/components/dashboard/dashboard-low-stock-card"
import { DashboardShortcuts } from "@/components/dashboard/dashboard-shortcuts"
import { DashboardStatusCard } from "@/components/dashboard/dashboard-status-card"
import { DashboardSupportStrip } from "@/components/dashboard/dashboard-support-strip"
import { DashboardUrgentCard } from "@/components/dashboard/dashboard-urgent-card"
import { AppHeader } from "@/components/layout/app-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

/** Corpo vazio = mês atual. Mesma chave de cache da tela de APACs e da de relatórios (sem período). */
const MONTH_REPORT_REQUEST = {}

/**
 * Visão geral do município (`DASHBOARD_ROLES`: todos menos `RECEPCIONISTA`). Só duas fontes, ambas
 * já usadas em outras telas: `POST /reports/apacs` com `{}` e `GET /notifications` (em cache pelo sino).
 */
export function DashboardPage() {
  const [now] = useState(() => new Date())
  const [auditTab, setAuditTab] = useState<AuditTab>(AUDIT_TAB.MUNICIPIO)
  const [formOpen, setFormOpen] = useState(false)
  const auditRef = useRef<HTMLDivElement>(null)

  const tenantName = useTenantName()
  const report = useApacsReport(MONTH_REPORT_REQUEST)
  const notifications = useNotifications()
  const support = notifications.data?.support
  const inventory = report.data?.inventory

  const month = format(now, "MMMM 'de' yyyy", { locale: ptBR })
  const monthLabel = month.charAt(0).toUpperCase() + month.slice(1)
  const today = format(now, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })

  const openSupport = () => {
    setAuditTab(AUDIT_TAB.SUPORTE)
    auditRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <>
      <AppHeader section="Dashboard" />

      <div className="flex flex-1 flex-col gap-6 p-4 md:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-[1.625rem] leading-tight font-bold tracking-tight">{greetingFor(now)}</h1>
            <p className="text-muted-foreground first-letter:uppercase">
              {tenantName === undefined ? today : `${tenantName} · ${today}`}
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium">
            <CalendarIcon className="size-4 text-muted-foreground" aria-hidden />
            {monthLabel}
          </span>
        </div>

        {support === null || support === undefined || support.count === 0 ? null : (
          <DashboardSupportStrip support={support} onOpen={openSupport} />
        )}

        {report.error === null ? null : (
          <Alert variant="destructive">
            <AlertTitle>Não foi possível carregar os números do mês</AlertTitle>
            <AlertDescription>{report.error.message}</AlertDescription>
          </Alert>
        )}

        <DashboardKpis report={report.data} />

        <div className="grid gap-4 *:min-w-0 xl:grid-cols-3">
          <div className="flex flex-col gap-4 xl:col-span-2">
            <DashboardCreatedCard report={report.data} monthLabel={monthLabel} />
            <DashboardStatusCard countByStatus={report.data?.countByStatus} />
          </div>
          <div className="flex flex-col gap-4">
            <DashboardUrgentCard urgent={notifications.data?.urgentApacs} />
            <DashboardLowStockCard lowStock={notifications.data?.lowStock} />
          </div>
        </div>

        <div className="grid gap-4 *:min-w-0 xl:grid-cols-3">
          <div ref={auditRef} className="scroll-mt-4 xl:col-span-2">
            <DashboardAuditCard support={support} tab={auditTab} onTabChange={setAuditTab} />
          </div>
          <div className="flex flex-col gap-4">
            {inventory === null ? null : <DashboardInventoryCard inventory={inventory} />}
            <DashboardShortcuts onCreateApac={() => setFormOpen(true)} />
          </div>
        </div>
      </div>

      <ApacFormSheet open={formOpen} onOpenChange={setFormOpen} />
    </>
  )
}
