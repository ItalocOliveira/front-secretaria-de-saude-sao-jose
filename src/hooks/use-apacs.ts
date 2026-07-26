import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { createApac, listApacs } from "@/api/apacs"

export const APACS_QUERY_KEY = ["apacs"] as const

export function useApacs() {
  return useQuery({
    queryKey: APACS_QUERY_KEY,
    queryFn: ({ signal }) => listApacs(signal),
  })
}

export function useCreateApac() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createApac,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: APACS_QUERY_KEY }),
  })
}
