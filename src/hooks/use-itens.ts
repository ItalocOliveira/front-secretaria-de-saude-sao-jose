import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { createItem, deleteItem, listItens, updateItem, type UpdateItemPayload } from "@/api/itens"

export const ITENS_QUERY_KEY = ["itens"] as const

export function useItens() {
  return useQuery({
    queryKey: ITENS_QUERY_KEY,
    queryFn: ({ signal }) => listItens(signal),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ITENS_QUERY_KEY }),
  })
}
