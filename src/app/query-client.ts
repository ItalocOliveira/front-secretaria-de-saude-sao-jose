import { QueryClient } from "@tanstack/react-query"

import { ApiError } from "@/api/client"

export const queryClient = new QueryClient({
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
