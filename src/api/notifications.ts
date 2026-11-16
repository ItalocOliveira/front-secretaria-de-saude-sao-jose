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

/** `{ from, to }` de um campo alterado em `PLATFORM_USER_UPDATED`. */
export type SupportChange = { from: string; to: string }

/**
 * `details` de uma ação do suporte — o formato varia com `action` (ver `describeSupportAction`):
 * `PLATFORM_USER_CREATED` traz `name`/`role` como texto; `PLATFORM_USER_UPDATED` traz `userName` e
 * `name`/`role` como `{ from, to }`; `PLATFORM_USER_PASSWORD_RESET` traz `userName`.
 */
export type SupportActionDetails = {
  name?: string | SupportChange
  role?: string | SupportChange
  userName?: string
  source?: string
  /** Quem da plataforma fez a ação. */
  platformAdmin?: string
  /** `PLATFORM_USER_DELETED` (só no `GET /activity-logs`). */
  reason?: string
}

/** Ação da plataforma (painel admin/suporte) no município. */
export type SupportActionDto = {
  id: string
  /** `PLATFORM_TENANT_CREATED` | `PLATFORM_USER_CREATED` | `PLATFORM_USER_UPDATED` | `PLATFORM_USER_PASSWORD_RESET`. */
  action: string
  created_at: string
  target_id: string | null
  details: SupportActionDetails | null
}

/**
 * Ações do suporte nos últimos `days` (30) dias — comunicado
 * `.docs/att-backend/2026-11-16-lgpd-users-e-pdf-apacs.md`, seção 3. **Não entra no `total`** e
 * não tem "lida": cada ação some sozinha depois de `days` dias.
 */
export type SupportActivityDto = { count: number; days: number; items: SupportActionDto[] }

export type NotificationsDto = {
  /** Número do badge (`lowStock.count + urgentApacs.count`) — `support` não conta. */
  total: number
  /** `items`: até 10, os de menor quantidade primeiro. `count` é o total. */
  lowStock: { count: number; items: LowStockItemDto[] }
  /** `items`: até 10, os mais antigos primeiro. `statuses`: status considerados "na fila". */
  urgentApacs: { count: number; statuses: ApacStatus[]; items: UrgentApacDto[] }
  /** Só `SECRETARIO`/`DIRETOR` recebem; os outros cargos, `null` (e `undefined` numa API anterior). */
  support?: SupportActivityDto | null
}

/** Sem body e sem query string. */
export function getNotifications(signal?: AbortSignal) {
  return request<NotificationsDto>("/notifications", { signal })
}
