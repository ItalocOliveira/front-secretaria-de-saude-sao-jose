import { Navigate, Outlet, useLocation } from "react-router"

import { useSession } from "@/hooks/use-session"

/**
 * Portão de autenticação. Como o token vive num store externo, expirar a sessão
 * (ou receber um `401`) derruba o usuário para o login sem nenhum `useEffect`.
 */
export function RequireAuth() {
  const { isAuthenticated } = useSession()
  const location = useLocation()

  if (!isAuthenticated) {
    // Guarda o destino para voltar depois do login. Só o caminho — nunca CPF/CNS.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
