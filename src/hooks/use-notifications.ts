import { useQuery } from "@tanstack/react-query"

import { getNotifications } from "@/api/notifications"
import { canSeeNotifications } from "@/lib/permissions"
import { useSession } from "@/hooks/use-session"

/**
 * Invalidar por esta chave depois de qualquer mutação que mexa em estoque ou em APACs, para o
 * badge do sino atualizar na hora em vez de esperar o próximo polling.
 */
export const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const

const POLL_INTERVAL_MS = 60_000

/**
 * Alertas do sino. Repete a cada 60 s **só com a aba visível** (`refetchIntervalInBackground: false`)
 * e não chama a rota para quem receberia `403` (`RECEPCIONISTA`).
 */
export function useNotifications() {
  const { claims } = useSession()
  const enabled = claims !== null && canSeeNotifications(claims.role)

  const query = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: ({ signal }) => getNotifications(signal),
    enabled,
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
  })

  return { ...query, enabled }
}
