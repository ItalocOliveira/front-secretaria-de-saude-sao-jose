import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { createUser, listUsers } from "@/api/users"

export const USERS_QUERY_KEY = ["users"] as const

export function useUsers() {
  return useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: ({ signal }) => listUsers(signal),
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY }),
  })
}
