import type { ReactNode } from "react"
import { MapPinOffIcon } from "lucide-react"

import { ApiError } from "@/api/client"
import { useTenant } from "@/hooks/use-tenant"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"

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
export function TenantGate({ children }: { children: ReactNode }) {
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
