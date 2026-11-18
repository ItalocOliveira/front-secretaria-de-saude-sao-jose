import { APAC_STATUS, type ApacStatus } from "@/lib/apac"

/**
 * Ordem fixa das fatias da pizza de status = ordem do fluxo da APAC, nunca por tamanho: a cor
 * segue o status, não o ranking.
 */
export const DASHBOARD_STATUS_ORDER: readonly ApacStatus[] = [
  APAC_STATUS.PENDENTE,
  APAC_STATUS.INSERIDO,
  APAC_STATUS.APROVADO,
  APAC_STATUS.ENTREGUE,
  APAC_STATUS.NEGADO,
  APAC_STATUS.CANCELADO,
]

/** Cor de cada status na pizza — só tokens do tema (`src/index.css`). */
export const DASHBOARD_STATUS_COLOR: Record<ApacStatus, string> = {
  PENDENTE: "var(--warning)",
  INSERIDO: "var(--sidebar-primary)",
  APROVADO: "var(--success)",
  ENTREGUE: "var(--chart-delivered)",
  NEGADO: "var(--destructive)",
  CANCELADO: "var(--muted-foreground)",
}

/** Abas do card de auditoria do dashboard. */
export const AUDIT_TAB = { MUNICIPIO: "municipio", SUPORTE: "suporte" } as const
export type AuditTab = (typeof AUDIT_TAB)[keyof typeof AUDIT_TAB]

/** "Bom dia" / "Boa tarde" / "Boa noite" pelo relógio do navegador. */
export function greetingFor(date: Date) {
  const hour = date.getHours()
  if (hour < 12) {
    return "Bom dia"
  }
  return hour < 18 ? "Boa tarde" : "Boa noite"
}
