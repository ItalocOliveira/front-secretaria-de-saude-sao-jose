import { Outlet } from "react-router"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export function AppShell() {
  return (
    <SidebarProvider>
      <AppSidebar />
      {/* `min-w-0`: item flex não encolhe abaixo do conteúdo sem isso, e tabelas
          largas empurrariam a página inteira para o scroll horizontal. */}
      <SidebarInset className="min-w-0">
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}
