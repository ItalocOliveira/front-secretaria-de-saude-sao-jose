import { useQuery, type QueryClient } from "@tanstack/react-query"

import { getTenant, type TenantInfo } from "@/api/auth"

export const TENANT_QUERY_KEY = ["auth", "tenant"] as const

/** Município do endereço (`GET /auth/tenant`). O endereço não muda na sessão: cache eterno. */
export function useTenant() {
  return useQuery({
    queryKey: TENANT_QUERY_KEY,
    queryFn: ({ signal }) => getTenant(signal),
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

/** Nome do município para exibição; `undefined` enquanto não carregou (ou se a API falhou). */
export function useTenantName() {
  return useTenant().data?.name
}

/**
 * `queryClient.clear()` sem perder o município: login e logout limpam o cache por
 * causa dos dados da conta, mas o município é do endereço e não muda com ela.
 */
export function clearKeepingTenant(queryClient: QueryClient) {
  const tenant = queryClient.getQueryData<TenantInfo>(TENANT_QUERY_KEY)
  queryClient.clear()

  if (tenant !== undefined) {
    queryClient.setQueryData(TENANT_QUERY_KEY, tenant)
  }
}
