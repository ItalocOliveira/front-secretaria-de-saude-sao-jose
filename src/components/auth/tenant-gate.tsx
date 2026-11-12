import type { ReactNode } from "react"
import { MapPinOffIcon } from "lucide-react"

import { ApiError } from "@/api/client"
import { TENANT_SLUG } from "@/lib/tenant"
import { useTenant } from "@/hooks/use-tenant"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { LandingPage } from "@/pages/landing-page"

function TenantNotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <Empty className="max-w-md border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MapPinOffIcon />
          </EmptyMedia>
          <EmptyTitle>Município não encontrado</EmptyTitle>
          <EmptyDescription>
            Este endereço não corresponde a nenhuma prefeitura cadastrada. Confira o endereço digitado.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </main>
  )
}

/**
 * Valida o município do endereço (`GET /auth/tenant`) antes de qualquer tela.
 * `404` = slug inexistente: o login também daria `404`, então nem mostramos o formulário.
 * Outras falhas (rede, cold start) não bloqueiam: o app segue e cada tela trata o próprio erro.
 */
function TenantGateWithTenant({ children }: { children: ReactNode }) {
  const { data, isPending, error } = useTenant()

  if (isPending) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background" aria-busy="true">
        <Spinner className="size-6 text-muted-foreground" />
        <span className="sr-only">Carregando…</span>
      </main>
    )
  }

  if (error instanceof ApiError && error.status === 404) {
    return <TenantNotFound />
  }

  return (
    <>
      {/* React 19 sobe o <title> para o <head>: o nome do município fica visível na aba. */}
      {data === undefined ? null : <title>{`ICOS — Secretaria de Saúde de ${data.name}`}</title>}
      {children}
    </>
  )
}

/**
 * Domínio principal / `www` / `localhost` sem município → landing neutra, sem router e sem
 * nenhuma chamada à API (`.docs/att-backend/2026-11-12-landing-sem-municipio.md`).
 * Com município, o gate valida o endereço. Dois componentes para o `useTenant()` nunca
 * ser chamado condicionalmente.
 */
export function TenantGate({ children }: { children: ReactNode }) {
  if (TENANT_SLUG === undefined) {
    return <LandingPage />
  }

  return <TenantGateWithTenant>{children}</TenantGateWithTenant>
}
