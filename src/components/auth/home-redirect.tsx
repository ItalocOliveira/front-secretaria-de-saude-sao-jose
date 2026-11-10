import { Navigate } from "react-router"

import { homeRouteFor } from "@/lib/permissions"
import { useSession } from "@/hooks/use-session"

/** Destino padrão, decidido por `homeRouteFor` (hoje `/apacs` para todos os cargos). */
export function HomeRedirect() {
  const { claims } = useSession()

  return <Navigate to={claims === null ? "/login" : homeRouteFor(claims.role)} replace />
}
