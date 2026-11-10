import type { ApacStatus } from "@/lib/apac"
import { request } from "@/api/client"

export type ReportInterval = "day" | "week"

/**
 * Corpo de `POST /reports/apacs`. Todos os campos são opcionais, mas
 * `startDate`/`endDate` só valem **juntos** — se só uma vier, a API ignora em
 * silêncio e usa o mês atual. Envie com offset de Brasília (`-03:00`).
 */
export type ApacsReportRequest = {
  startDate?: string
  endDate?: string
  interval?: ReportInterval
}

type Period = { startDate: string; endDate: string }

/** Resposta de `POST /reports/apacs`. Datas de `period` vêm em UTC. */
export type ApacsReport = {
  period: Period
  totalCreatedINperiod: number
  comparisonWithPreviousPeriod: {
    previousPeriod: Period
    previousTotal: number
    difference: number
    /** `null` quando `previousTotal === 0`. */
    percentChange: number | null
  }
  /** Chaves com 0 não aparecem — trate ausência como 0. */
  countByStatusInPeriod: Record<string, number>
  /** Todas as APACs do sistema, sem filtro de data. */
  countByStatus: Record<string, number>
  countByProcedureInPeriod: Record<string, number>
  countByPriorityInPeriod: Record<string, number>
  countByAcsInPeriod: Record<string, number>
  /** Texto livre do cadastro; sem município → `"NAO_INFORMADO"`. */
  countByMunicipalityInPeriod: Record<string, number>
  /** Estado atual da fila, sem filtro de data. */
  pendingQueue: {
    statuses: ApacStatus[]
    total: number
    /** Todas as prioridades sempre presentes, mesmo com 0. */
    byPriority: Record<string, number>
  }
  createdOverTime: {
    interval: ReportInterval
    timeZone: string
    /** `date` = "YYYY-MM-DD" já no fuso local, com lacunas preenchidas com 0. */
    points: { date: string; count: number }[]
  }
}

export function getApacsReport(body: ApacsReportRequest, signal?: AbortSignal) {
  // Sempre manda um objeto (mesmo `{}`): corpo vazio com `Content-Type: application/json`
  // devolve 400 do Fastify.
  return request<ApacsReport>("/reports/apacs", { method: "POST", body, signal })
}
