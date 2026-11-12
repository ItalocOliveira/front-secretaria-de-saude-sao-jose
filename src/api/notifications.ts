import type { ApacStatus } from "@/lib/apac"
import type { ItemType } from "@/lib/itens"
import { request } from "@/api/client"

/**
 * Contrato de `GET /notifications` — `.docs/att-backend/2026-11-12-notificacoes-e-estoque-minimo.md`.
 *
 * Os alertas são calculados na hora pela API: não existe "marcar como lida", o alerta some
 * sozinho quando o problema é resolvido (estoque reposto, APAC aprovada/negada/cancelada…).
 * `RECEPCIONISTA` recebe `403` — use `canSeeNotifications` antes de chamar.
 */

/** Item com `amount < min_amount`. */
export type LowStockItemDto = {
  id: string
  name: string
  type: ItemType
  amount: number
  min_amount: number
}

/** APAC `URGENTE` ainda na fila (status em `urgentApacs.statuses`). */
export type UrgentApacDto = {
  id: string
  protocol_number: number
  name: string
  /** Chave do enum (`SCREAMING_SNAKE_CASE`) — exibir via `APAC_PROCEDURE_LABEL`. */
  procedure: string
  status: ApacStatus
  created_at: string
}

export type NotificationsDto = {
  /** Número do badge (`lowStock.count + urgentApacs.count`). */
  total: number
  /** `items`: até 10, os de menor quantidade primeiro. `count` é o total. */
  lowStock: { count: number; items: LowStockItemDto[] }
  /** `items`: até 10, os mais antigos primeiro. `statuses`: status considerados "na fila". */
  urgentApacs: { count: number; statuses: ApacStatus[]; items: UrgentApacDto[] }
}

/** Sem body e sem query string. */
export function getNotifications(signal?: AbortSignal) {
  return request<NotificationsDto>("/notifications", { signal })
}
