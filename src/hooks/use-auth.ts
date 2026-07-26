import { useCallback } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { getAuthenticatedUser, login } from "@/api/auth"
import { clearToken, setToken } from "@/lib/session"
import { useSession } from "@/hooks/use-session"

export const AUTH_ME_QUERY_KEY = ["auth", "me"] as const

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      // Limpa antes de autenticar: o cache pode ter dados de outra conta, e a
      // troca de token dispara refetch imediato das queries habilitadas.
      queryClient.clear()
      setToken(data.token)
    },
  })
}

export function useSignOut() {
  const queryClient = useQueryClient()

  return useCallback(() => {
    clearToken()
    queryClient.clear()
  }, [queryClient])
}

/** Perfil do usuário autenticado. Lembre: a API não devolve o `name`. */
export function useAuthenticatedUser() {
  const { isAuthenticated } = useSession()

  return useQuery({
    queryKey: AUTH_ME_QUERY_KEY,
    queryFn: ({ signal }) => getAuthenticatedUser(signal),
    enabled: isAuthenticated,
  })
}
