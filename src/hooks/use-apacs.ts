import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { createApac, listApacs, uploadApacPdf } from "@/api/apacs"

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

/** PUT direto pro bucket — não invalida a query: `GET /apacs` não devolve o PDF em si. */
export function useUploadApacPdf() {
  return useMutation({
    mutationFn: ({ uploadUrl, file }: { uploadUrl: string; file: File }) => uploadApacPdf(uploadUrl, file),
  })
}
