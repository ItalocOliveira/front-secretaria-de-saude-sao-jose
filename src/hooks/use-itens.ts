import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"

import {
  createItem,
  createItemMovement,
  deleteItem,
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

export const ITENS_QUERY_KEY = ["itens"] as const

/** Estoque e `min_amount` alimentam o sino (`lowStock`) — toda mutação de item atualiza os dois. */
function invalidateItens(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ITENS_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
  ])
}

export function useItens(params: ListParams<ItemStatus>) {
  return useQuery({
    queryKey: [...ITENS_QUERY_KEY, params],
    queryFn: ({ signal }) => listItens(params, signal),
    placeholderData: keepPreviousData,
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

/** PUT direto pro bucket — não invalida a query: `image_url` já vem em `item`/`GET /itens` assim que o item é criado. */
export function useUploadItemImage() {
  return useMutation({
    mutationFn: ({ uploadUrl, file }: { uploadUrl: string; file: File }) => uploadItemImage(uploadUrl, file),
  })
}
