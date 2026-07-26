import { Navigate } from "react-router"

import { homeRouteFor } from "@/lib/permissions"
import { useSession } from "@/hooks/use-session"

/**
 * Destino padrão. `SECRETARIA` não acessa APACs e `RECEPCIONISTA`/`REGULADOR` não
 * acessam usuários, então a home depende do perfil.
 */
export function HomeRedirect() {
  const { claims } = useSession()

  return <Navigate to={claims === null ? "/login" : homeRouteFor(claims.role)} replace />
}
