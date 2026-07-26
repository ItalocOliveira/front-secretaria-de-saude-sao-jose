import { Component, type ErrorInfo, type ReactNode } from "react"
import { isRouteErrorResponse, useNavigate, useRouteError } from "react-router"
import { AlertTriangleIcon, HouseIcon, RotateCcwIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

function describe(error: unknown) {
  if (isRouteErrorResponse(error)) {
    return `${error.status} ${error.statusText}`
  }

  if (error instanceof Error) {
    return error.stack ?? error.message
  }

  return String(error)
}

function ErrorState({
  className,
  description,
  error,
  onRetry,
  title,
}: {
  className?: string
  description: string
  error: unknown
  onRetry: () => void
  title: string
}) {
  return (
    <div className={cn("flex w-full flex-1 items-center justify-center p-6", className)}>
      <Empty className="max-w-xl border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AlertTriangleIcon />
          </EmptyMedia>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>

        <EmptyContent className="max-w-none">
          {/* O detalhe técnico fica restrito ao desenvolvimento: a mensagem pode carregar
              dado do paciente e essa tela é visível para o usuário final. */}
          {import.meta.env.DEV ? (
            <pre className="max-h-48 w-full overflow-auto rounded-md bg-muted p-3 text-left text-xs whitespace-pre-wrap text-muted-foreground">
              {describe(error)}
            </pre>
          ) : null}

          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={onRetry}>
              <RotateCcwIcon data-icon="inline-start" />
              Tentar novamente
            </Button>
            {/* Âncora nativa em vez de `Link`: o `AppErrorBoundary` vive fora do
                `RouterProvider`, onde os hooks de navegação não existem. */}
            <Button variant="outline" render={<a href="/apacs" />}>
              <HouseIcon data-icon="inline-start" />
              Ir para o início
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    </div>
  )
}

/**
 * Boundary das rotas (`errorElement`). Substitui a tela crua do react-router e cobre
 * tanto erro de renderização quanto resposta de erro lançada por loader/action.
 */
export function RouteErrorBoundary() {
  const error = useRouteError()
  const navigate = useNavigate()

  const isNotFound = isRouteErrorResponse(error) && error.status === 404

  return (
    <ErrorState
      className="min-h-[60svh]"
      title={isNotFound ? "Página não encontrada" : "Algo deu errado"}
      description={
        isNotFound
          ? "O endereço acessado não existe ou foi movido."
          : "Não foi possível carregar esta tela. Nenhum dado foi perdido — tente novamente."
      }
      error={error}
      // Erro de renderização não se resolve sozinho: só uma nova navegação remonta a rota.
      onRetry={() => navigate(0)}
    />
  )
}

type AppErrorBoundaryProps = { children: ReactNode }
type AppErrorBoundaryState = { error: Error | null }

/**
 * Rede de segurança acima do router, para o que o `errorElement` não alcança
 * (o próprio `RouterProvider`, providers de tema/tooltip e o `Toaster`).
 */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Sem serviço de observabilidade ainda; em produção o erro fica só na tela.
    if (import.meta.env.DEV) {
      console.error("[AppErrorBoundary]", error, info.componentStack)
    }
  }

  render() {
    if (this.state.error === null) {
      return this.props.children
    }

    return (
      <ErrorState
        className="min-h-svh"
        title="A aplicação parou de responder"
        description="Ocorreu uma falha inesperada. Tente novamente ou recarregue a página."
        error={this.state.error}
        onRetry={() => this.setState({ error: null })}
      />
    )
  }
}
