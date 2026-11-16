import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"

import {
  attachItemImage,
  createItem,
  createItemMovement,
  deleteItem,
  listAllItens,
  listItens,
  updateItem,
  uploadItemImage,
  type CreateItemMovementPayload,
  type UpdateItemPayload,
} from "@/api/itens"
import { ApiError } from "@/api/client"
import type { ListParams } from "@/api/pagination"
import type { ItemStatus } from "@/lib/itens"
import { NOTIFICATIONS_QUERY_KEY } from "@/hooks/use-notifications"
import { REPORTS_QUERY_KEY } from "@/hooks/use-reports"

export const ITENS_QUERY_KEY = ["itens"] as const

/** Estoque e `min_amount` alimentam o sino (`lowStock`) e a seção do almoxarifado do relatório. */
function invalidateItens(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ITENS_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: REPORTS_QUERY_KEY }),
  ])
}

export function useItens(params: ListParams<ItemStatus>) {
  return useQuery({
    queryKey: [...ITENS_QUERY_KEY, params],
    queryFn: ({ signal }) => listItens(params, signal),
    placeholderData: keepPreviousData,
  })
}

/**
 * Todos os itens (todas as páginas) para o inventário completo do relatório. Fica sob
 * `ITENS_QUERY_KEY`, então qualquer mutação de item já o invalida.
 */
export function useAllItens(enabled: boolean) {
  return useQuery({
    queryKey: [...ITENS_QUERY_KEY, "all"],
    queryFn: ({ signal }) => listAllItens(signal),
    enabled,
  })
}

export function useCreateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createItem,
    onSuccess: () => invalidateItens(queryClient),
  })
}

export function useUpdateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateItemPayload }) => updateItem(id, payload),
    onSuccess: () => invalidateItens(queryClient),
  })
}

export function useDeleteItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteItem(id),
    // `404`: o item já não existe — some da tabela do mesmo jeito.
    onSettled: (_data, error) =>
      error === null || (error instanceof ApiError && error.status === 404) ? invalidateItens(queryClient) : undefined,
  })
}

export function useCreateItemMovement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreateItemMovementPayload }) =>
      createItemMovement(id, payload),
    onSuccess: () => invalidateItens(queryClient),
  })
}

/**
 * Só o PUT direto pro bucket — usado na foto comprovante das movimentações, que não tem
 * `confirm` nem `has_image`. Para a foto do item, use `useAttachItemImage`.
 */
export function useUploadItemImage() {
  return useMutation({
    mutationFn: ({ uploadUrl, file }: { uploadUrl: string; file: File }) => uploadItemImage(uploadUrl, file),
  })
}

/**
 * Adiciona/substitui a foto de um item (`upload-url` → `PUT` no R2 → `confirm`). Passe
 * `uploadUrl` para reaproveitar a URL devolvida pelo `POST /itens`; sem ela, gera uma nova.
 * Invalida a listagem porque `has_image` muda e só o `GET /itens` traz o `image_url` novo.
 */
export function useAttachItemImage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, file, uploadUrl }: { id: string; file: File; uploadUrl?: string }) =>
      attachItemImage(id, file, uploadUrl),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ITENS_QUERY_KEY }),
  })
}
