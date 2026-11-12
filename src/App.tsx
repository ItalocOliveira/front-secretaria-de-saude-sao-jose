import { QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "react-router/dom"

import { queryClient } from "@/app/query-client"
import { router } from "@/app/router"
import { TenantGate } from "@/components/auth/tenant-gate"

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TenantGate>
        <RouterProvider router={router} />
      </TenantGate>
    </QueryClientProvider>
  )
}

export default App
