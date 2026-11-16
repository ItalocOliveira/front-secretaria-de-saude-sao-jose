import type { UserRole } from "@/lib/apac"
import { request } from "@/api/client"
import { toListQuery, type ListParams, type Paginated } from "@/api/pagination"

/**
 * Contrato de `GET /activity-logs` — `.docs/att-backend/2026-11-16-auditoria-municipio.md`.
 *
 * Registro de atividade do município do usuário logado, mais recentes primeiro, **sem IP**.
 * Só `DEV`/`SECRETARIO`/`DIRETOR` (os demais recebem `403` — use `canSeeAudit` antes de chamar).
 * `details` nunca traz senha, CPF nem CNS.
 */
export type ActivityLogUser = { id: string; name: string; role: UserRole }

export type ActivityLogDto = {
  id: string
  /** Valor de `ACTIVITY_ACTION` (`src/lib/activity.ts`); uma ação nova aparece crua em vez de sumir. */
  action: string
  created_at: string
  /** Id do usuário, APAC, ofício ou item afetado (ver tabela do comunicado). */
  target_id: string | null
  /** Formato varia com `action` — leia só via `describeActivity`. */
  details: Record<string, unknown> | null
  /**
   * `null` em ações da plataforma (`PLATFORM_*`, autor em `details.platformAdmin`), de usuário já
   * excluído (`details.deletedUserId`) e em `LOGIN_FAILED` com CPF que não existe no município.
   */
  user: ActivityLogUser | null
}

/** `page`/`pageSize` (máx. 100) + filtros próprios. `search`/`status` não existem nesta rota. */
export type ActivityLogParams = Pick<ListParams, "page" | "pageSize"> & {
  action?: string
  /** Quem fez a ação. */
  userId?: string
}

export function listActivityLogs(params: ActivityLogParams, signal?: AbortSignal) {
  const { action, userId, ...list } = params
  return request<Paginated<ActivityLogDto>>(`/activity-logs${toListQuery(list, { action, userId })}`, { signal })
}
