import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { UserRole } from "@/lib/apac"
import type { ListParams } from "@/api/pagination"
import { createUser, listUsers } from "@/api/users"

export const USERS_QUERY_KEY = ["users"] as const

export function useUsers(params: ListParams<UserRole>) {
  return useQuery({
    queryKey: [...USERS_QUERY_KEY, params],
    queryFn: ({ signal }) => listUsers(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY }),
  })
}
