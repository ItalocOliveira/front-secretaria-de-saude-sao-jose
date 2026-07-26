import { QueryClient } from "@tanstack/react-query"

import { ApiError } from "@/api/client"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // As listagens não têm paginação nem filtro no servidor; meio minuto de
      // frescor evita refetch a cada navegação sem deixar a tela obsoleta.
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // 4xx é resposta definitiva (credencial, permissão, payload): insistir só
        // atrasa o feedback. Rede e 5xx podem ser cold start da Railway — aí sim.
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
