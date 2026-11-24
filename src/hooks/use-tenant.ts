import { useQuery, type QueryClient } from "@tanstack/react-query"

import { getTenant, type TenantInfo } from "@/api/auth"
import { TENANT_SLUG } from "@/lib/tenant"

export const TENANT_QUERY_KEY = ["auth", "tenant"] as const

/** Município do endereço (`GET /auth/tenant`). O endereço não muda na sessão: cache eterno. */
export function useTenant() {
  return useQuery({
    queryKey: TENANT_QUERY_KEY,
    queryFn: ({ signal }) => getTenant(signal),
    // Sem município no endereço só existe a landing; nada deve consultar a API sem `X-Tenant`.
    enabled: TENANT_SLUG !== undefined,
    staleTime: Infinity,
    gcTime: Infinity,
    // Sem isto, a API em 500 vira loop: o `TenantGate` libera as telas depois das tentativas,
    // cada componente que lê o município (login, sidebar, `TenantLogo`) monta e refaz a busca,
    // a query volta a `pending` (não há `data`) e o gate troca tudo pelo spinner de novo.
    // Chamados `.docs/chamados/2026-11-16-*` e `2026-11-24-*`.
    retryOnMount: false,
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
