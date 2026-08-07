import { createBrowserRouter } from "react-router"

import { APAC_ROLES, ITEM_ROLES, USER_MANAGEMENT_ROLES } from "@/lib/permissions"
import { HomeRedirect } from "@/components/auth/home-redirect"
import { RequireAuth } from "@/components/auth/require-auth"
import { RequireRole } from "@/components/auth/require-role"
import { RouteErrorBoundary } from "@/components/error-boundary"
import { AppShell } from "@/components/layout/app-shell"
import { ApacsPage } from "@/pages/apacs-page"
import { ItensPage } from "@/pages/itens-page"
import { LoginPage } from "@/pages/login-page"
import { NewUserPage } from "@/pages/new-user-page"
import { PendenciasPage } from "@/pages/pendencias-page"
import { UsersPage } from "@/pages/users-page"

export const router = createBrowserRouter([
  {
    // Rota sem `path`, só para ancorar o boundary: qualquer erro de descendente
    // que não tenha um `errorElement` mais próximo para aqui.
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: "/login", element: <LoginPage /> },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <AppShell />,
            children: [
              // Cada área tem seu boundary: o erro renderiza dentro do `Outlet`,
              // então sidebar e navegação continuam de pé.
              {
                element: <RequireRole allowed={APAC_ROLES} />,
                children: [
                  { path: "/apacs", element: <ApacsPage />, errorElement: <RouteErrorBoundary /> },
                  { path: "/pendencias", element: <PendenciasPage />, errorElement: <RouteErrorBoundary /> },
                ],
              },
              {
                element: <RequireRole allowed={USER_MANAGEMENT_ROLES} />,
                children: [
                  { path: "/usuarios", element: <UsersPage />, errorElement: <RouteErrorBoundary /> },
                  { path: "/usuarios/novo", element: <NewUserPage />, errorElement: <RouteErrorBoundary /> },
                ],
              },
              {
                element: <RequireRole allowed={ITEM_ROLES} />,
                children: [{ path: "/almoxarifado", element: <ItensPage />, errorElement: <RouteErrorBoundary /> }],
              },
            ],
          },
        ],
      },
      // Não existe home única: cada perfil enxerga uma área diferente.
      { path: "*", element: <HomeRedirect /> },
    ],
  },
])
