import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query"

import { ApiError } from "@/api/client"
import { TENANT_QUERY_KEY } from "@/hooks/use-tenant"

/**
 * `401` derruba a sessão (`request()` limpa o token). Um dos motivos é o município ter sido
 * suspenso; o município fica em cache eterno, então revalidamos para o `TenantGate` trocar o
 * login pela tela de "acesso suspenso" sem precisar de F5. Refetch em segundo plano: sem spinner.
 * O mesmo vale para o `403` do login (suspenso com a tela de login já aberta).
 */
function revalidateTenantOnAuthError(error: unknown) {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
    void queryClient.invalidateQueries({ queryKey: TENANT_QUERY_KEY })
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: revalidateTenantOnAuthError }),
  mutationCache: new MutationCache({ onError: revalidateTenantOnAuthError }),
  defaultOptions: {
    queries: {
      // Meio minuto de frescor evita refetch a cada navegação (e a cada volta de
      // página na tabela) sem deixar a tela obsoleta.
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // 4xx é resposta definitiva (credencial, permissão, payload): insistir só
        // atrasa o feedback. Inclui o `429` do rate limit (300 req/min por IP): repetir
        // em loop só prolonga o bloqueio. Rede e 5xx podem ser cold start da Railway — aí sim.
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false
        }

        return failureCount < 2
      },
    },
    mutations: {
      // Mutação repetida pode duplicar registro; quem decide repetir é o usuário.
      retry: false,
    },
  },
})
