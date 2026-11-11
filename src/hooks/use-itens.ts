import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

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

export const ITENS_QUERY_KEY = ["itens"] as const

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ITENS_QUERY_KEY }),
  })
}

export function useUpdateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateItemPayload }) => updateItem(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ITENS_QUERY_KEY }),
  })
}

export function useDeleteItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteItem(id),
    // `404`: o item já não existe — some da tabela do mesmo jeito.
    onSettled: (_data, error) =>
      error === null || (error instanceof ApiError && error.status === 404)
        ? queryClient.invalidateQueries({ queryKey: ITENS_QUERY_KEY })
        : undefined,
  })
}

export function useCreateItemMovement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreateItemMovementPayload }) =>
      createItemMovement(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ITENS_QUERY_KEY }),
  })
}

/** PUT direto pro bucket — não invalida a query: `image_url` já vem em `item`/`GET /itens` assim que o item é criado. */
export function useUploadItemImage() {
  return useMutation({
    mutationFn: ({ uploadUrl, file }: { uploadUrl: string; file: File }) => uploadItemImage(uploadUrl, file),
  })
}
