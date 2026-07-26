import { createBrowserRouter, Navigate } from "react-router"

import { RouteErrorBoundary } from "@/components/error-boundary"
import { AppShell } from "@/components/layout/app-shell"
import { ApacsPage } from "@/pages/apacs-page"
import { LoginPage } from "@/pages/login-page"
import { SignupPage } from "@/pages/signup-page"

export const router = createBrowserRouter([
  {
    // Rota sem `path`, só para ancorar o boundary: qualquer erro de descendente
    // que não tenha um `errorElement` mais próximo para aqui.
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <AppShell />,
        children: [
          // Boundary próprio: o erro renderiza dentro do `Outlet`, então sidebar e
          // header continuam de pé e o usuário não perde a navegação.
          { path: "/apacs", element: <ApacsPage />, errorElement: <RouteErrorBoundary /> },
        ],
      },
      { path: "/login", element: <LoginPage /> },
      { path: "/cadastro", element: <SignupPage /> },
      { path: "*", element: <Navigate to="/apacs" replace /> },
    ],
  },
])
