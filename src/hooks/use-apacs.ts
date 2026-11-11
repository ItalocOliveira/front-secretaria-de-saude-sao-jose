import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  createApac,
  deleteApac,
  listApacs,
  updateApac,
  uploadApacPdf,
  type ApacListParams,
  type UpdateApacPayload,
} from "@/api/apacs"
import { ApiError } from "@/api/client"

/** Prefixo de todas as páginas/filtros — invalidar por ele atualiza qualquer listagem aberta. */
export const APACS_QUERY_KEY = ["apacs"] as const

export function useApacs(params: ApacListParams) {
  return useQuery({
    queryKey: [...APACS_QUERY_KEY, params],
    queryFn: ({ signal }) => listApacs(params, signal),
    // Trocar de página/busca mantém a página anterior na tela até a nova chegar.
    placeholderData: keepPreviousData,
  })
}

export function useCreateApac() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createApac,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: APACS_QUERY_KEY }),
  })
}

export function useUpdateApac() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateApacPayload }) => updateApac(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: APACS_QUERY_KEY }),
  })
}

/** Invalida também no `404`: a APAC já não existe, então tem que sumir da tabela do mesmo jeito. */
export function useDeleteApac() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteApac(id),
    onSettled: (_data, error) =>
      error === null || (error instanceof ApiError && error.status === 404)
        ? queryClient.invalidateQueries({ queryKey: APACS_QUERY_KEY })
        : undefined,
  })
}

/** PUT direto pro bucket — não invalida a query: `GET /apacs` não devolve o PDF em si. */
export function useUploadApacPdf() {
  return useMutation({
    mutationFn: ({ uploadUrl, file }: { uploadUrl: string; file: File }) => uploadApacPdf(uploadUrl, file),
  })
}
