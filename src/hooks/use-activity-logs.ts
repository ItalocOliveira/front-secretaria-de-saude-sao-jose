import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { listActivityLogs, type ActivityLogParams } from "@/api/activity-logs"
import { canSeeAudit } from "@/lib/permissions"
import { useSession } from "@/hooks/use-session"

export const ACTIVITY_LOGS_QUERY_KEY = ["activity-logs"] as const

/** `GET /activity-logs`. Não chama a rota para quem receberia `403` (só `DEV`/`SECRETARIO`/`DIRETOR` acessam). */
export function useActivityLogs(params: ActivityLogParams) {
  const { claims } = useSession()
  const enabled = claims !== null && canSeeAudit(claims.role)

  const query = useQuery({
    queryKey: [...ACTIVITY_LOGS_QUERY_KEY, params],
    queryFn: ({ signal }) => listActivityLogs(params, signal),
    enabled,
    // Trocar de página/filtro mantém a página anterior na tela até a nova chegar.
    placeholderData: keepPreviousData,
  })

  return { ...query, enabled }
}
