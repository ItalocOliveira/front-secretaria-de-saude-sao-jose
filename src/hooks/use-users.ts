import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { UserRole } from "@/lib/apac"
import type { ListParams } from "@/api/pagination"
import { createUser, deleteUser, listUsers } from "@/api/users"
import { ACTIVITY_LOGS_QUERY_KEY } from "@/hooks/use-activity-logs"

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

/** Exclusão gera `USER_DELETED` na auditoria: invalida a lista de usuários e o registro de atividade. */
export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteUser,
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ACTIVITY_LOGS_QUERY_KEY }),
      ]),
  })
}
