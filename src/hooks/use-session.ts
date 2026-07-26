import { useMemo, useSyncExternalStore } from "react"

import { decodeToken, getToken, subscribeToSession } from "@/lib/session"

/**
 * Sessão atual, reativa. Como o store é externo, um `401` tratado no client HTTP
 * derruba a sessão e a árvore React re-renderiza sozinha.
 */
export function useSession() {
  const token = useSyncExternalStore(subscribeToSession, getToken)
  const claims = useMemo(() => (token === null ? null : decodeToken(token)), [token])

  return { token, claims, isAuthenticated: claims !== null }
}
