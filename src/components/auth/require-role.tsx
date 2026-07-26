import { Link, Outlet } from "react-router"
import { ShieldXIcon } from "lucide-react"

import { USER_ROLE_LABEL, type UserRole } from "@/lib/apac"
import { homeRouteFor } from "@/lib/permissions"
import { useSession } from "@/hooks/use-session"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

/**
 * Portão de perfil. A API continua sendo a autoridade (responde `403`); isto
 * existe para o usuário ver uma explicação em vez de uma tela quebrada.
 */
export function RequireRole({ allowed }: { allowed: readonly UserRole[] }) {
  const { claims } = useSession()

  if (claims === null) {
    // `RequireAuth` já está redirecionando neste mesmo ciclo.
    return null
  }

  if (allowed.includes(claims.role)) {
    return <Outlet />
  }

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Empty className="max-w-md border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShieldXIcon />
          </EmptyMedia>
          <EmptyTitle>Acesso negado</EmptyTitle>
          <EmptyDescription>O perfil {USER_ROLE_LABEL[claims.role]} não tem permissão para esta área.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button render={<Link to={homeRouteFor(claims.role)} />}>Ir para a minha área</Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
