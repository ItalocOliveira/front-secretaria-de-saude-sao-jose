import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  createApac,
  deleteApac,
  listApacs,
  attachApacPdf,
  updateApac,
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

/**
 * Anexa/substitui o PDF de uma APAC (`upload-url` → `PUT` no R2 → `confirm`). Passe `uploadUrl`
 * para reaproveitar a URL devolvida pelo `POST /apacs`; sem ela, gera uma nova. Invalida a
 * listagem porque `has_pdf` muda.
 */
export function useAttachApacPdf() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, file, uploadUrl }: { id: string; file: File; uploadUrl?: string }) =>
      attachApacPdf(id, file, uploadUrl),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: APACS_QUERY_KEY }),
  })
}
