import type { DateRange } from "react-day-picker"
import { format } from "date-fns"

import type { ApacsReportRequest, ReportInterval } from "@/api/reports"
import {
  APAC_ACS_LABEL,
  APAC_PRIORITY_LABEL,
  APAC_PROCEDURE_LABEL,
  APAC_STATUS_LABEL,
  type ApacAcs,
  type ApacPriority,
  type ApacProcedure,
  type ApacStatus,
} from "@/lib/apac"

/** Fuso usado pela API para decidir o dia de cada APAC. */
export const REPORT_TIME_ZONE = "America/Fortaleza"

/**
 * Monta o corpo do relatório. Sem período → `{}` (a API usa o mês atual).
 * As datas vão com offset de Brasília para os limites baterem com o dia local —
 * com `Z` o período ficaria deslocado 3h.
 */
export function buildReportRequest(range: DateRange | undefined, interval: ReportInterval): ApacsReportRequest {
  if (range?.from === undefined) {
    return { interval }
  }

  // `startDate` e `endDate` precisam ir juntos; período aberto vira um dia só.
  const to = range.to ?? range.from

  return {
    startDate: `${format(range.from, "yyyy-MM-dd")}T00:00:00-03:00`,
    endDate: `${format(to, "yyyy-MM-dd")}T23:59:59.999-03:00`,
    interval,
  }
}

const UTC_DATE_FORMAT = new Intl.DateTimeFormat("pt-BR", { timeZone: REPORT_TIME_ZONE, dateStyle: "short" })

/** Datas de `period`/`previousPeriod` vêm em UTC — exibe no fuso de Brasília. */
export function formatReportDate(iso: string) {
  return UTC_DATE_FORMAT.format(new Date(iso))
}

/**
 * `"YYYY-MM-DD"` dos pontos da série já é data local. **Não** passe por
 * `new Date()` — o JS interpretaria como UTC e mostraria o dia anterior.
 */
export function formatPointDate(date: string, withYear = false) {
  const [year, month, day] = date.split("-")
  return withYear ? `${day}/${month}/${year}` : `${day}/${month}`
}

const PERCENT_FORMAT = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1, signDisplay: "exceptZero" })
const NUMBER_FORMAT = new Intl.NumberFormat("pt-BR", { signDisplay: "exceptZero" })

export function formatPercentChange(percent: number) {
  return `${PERCENT_FORMAT.format(percent)}%`
}

export function formatDifference(difference: number) {
  return NUMBER_FORMAT.format(difference)
}

export type BreakdownEntry = { key: string; label: string; count: number }

/** `Record<chave, contagem>` → lista ordenada por contagem decrescente, com rótulo legível. */
export function toBreakdown(counts: Record<string, number>, label: (key: string) => string): BreakdownEntry[] {
  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([key, count]) => ({ key, label: label(key), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "pt-BR"))
}

// As chaves vêm cruas dos enums. Chave desconhecida (enum novo no backend) cai
// no próprio valor em vez de quebrar a tela.
export const statusLabel = (key: string) => APAC_STATUS_LABEL[key as ApacStatus] ?? key
export const priorityLabel = (key: string) => APAC_PRIORITY_LABEL[key as ApacPriority] ?? key
export const procedureLabel = (key: string) => APAC_PROCEDURE_LABEL[key as ApacProcedure] ?? key
export const acsLabel = (key: string) => APAC_ACS_LABEL[key as ApacAcs] ?? key
export const municipalityLabel = (key: string) => (key === "NAO_INFORMADO" ? "Não informado" : key)
