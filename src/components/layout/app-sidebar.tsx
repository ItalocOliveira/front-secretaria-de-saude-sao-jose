import { Link, useLocation } from "react-router"
import {
  BuildingIcon,
  ChartColumnIcon,
  CircleQuestionMarkIcon,
  FileTextIcon,
  HeartPulseIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  StethoscopeIcon,
  TriangleAlertIcon,
  UserCogIcon,
  UsersIcon,
} from "lucide-react"

import type { UserRole } from "@/lib/apac"
import { APAC_ROLES, homeRouteFor, USER_MANAGEMENT_ROLES } from "@/lib/permissions"
import { useSession } from "@/hooks/use-session"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

type NavItem = {
  title: string
  icon: typeof FileTextIcon
  /** Ausente enquanto a tela não existe — o item vira um botão desabilitado. */
  url?: string
  badge?: number
  /** Ausente = visível para qualquer perfil autenticado. */
  roles?: readonly UserRole[]
}

const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", icon: LayoutDashboardIcon },
  { title: "APACs", icon: FileTextIcon, url: "/apacs", roles: APAC_ROLES },
  { title: "Usuários", icon: UserCogIcon, url: "/usuarios", roles: USER_MANAGEMENT_ROLES },
  { title: "Pendências", icon: TriangleAlertIcon },
  { title: "Pacientes", icon: UsersIcon },
  { title: "Profissionais", icon: StethoscopeIcon },
  { title: "Unidades", icon: BuildingIcon },
  { title: "Relatórios", icon: ChartColumnIcon },
]

const SUPPORT_ITEMS: NavItem[] = [
  { title: "Configurações", icon: SettingsIcon },
  { title: "Ajuda", icon: CircleQuestionMarkIcon },
]

const APP_VERSION = "2.1.0"

function NavMenu({ items }: { items: NavItem[] }) {
  const { pathname } = useLocation()
  const { claims } = useSession()

  // Esconde o que o perfil não alcança. A API continua barrando com 403; isto só
  // evita oferecer um caminho que termina em "acesso negado".
  const visibleItems = items.filter(
    (item) => item.roles === undefined || (claims !== null && item.roles.includes(claims.role))
  )

  return (
    <SidebarMenu>
      {visibleItems.map((item) =>
        item.url ? (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              isActive={pathname.startsWith(item.url)}
              tooltip={item.title}
              render={<Link to={item.url} />}
            >
              <item.icon />
              <span>{item.title}</span>
            </SidebarMenuButton>
            {item.badge ? <SidebarMenuBadge>{item.badge}</SidebarMenuBadge> : null}
          </SidebarMenuItem>
        ) : (
          <SidebarMenuItem key={item.title}>
            <Tooltip>
              <TooltipTrigger render={<SidebarMenuButton aria-disabled />}>
                <item.icon />
                <span>{item.title}</span>
              </TooltipTrigger>
              <TooltipContent side="right">Em breve</TooltipContent>
            </Tooltip>
            {item.badge ? <SidebarMenuBadge>{item.badge}</SidebarMenuBadge> : null}
          </SidebarMenuItem>
        )
      )}
    </SidebarMenu>
  )
}

export function AppSidebar() {
  const { claims } = useSession()

  // Nem todo perfil enxerga APACs, então o logo leva para a home de cada um.
  const homeRoute = claims === null ? "/" : homeRouteFor(claims.role)

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="Regulação em Saúde" render={<Link to={homeRoute} />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <HeartPulseIcon />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-medium">SAÚDE</span>
                <span className="text-xs text-muted-foreground">Regulação</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMenu items={NAV_ITEMS} />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>Suporte</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMenu items={SUPPORT_ITEMS} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        <span className="text-xs text-muted-foreground">Versão {APP_VERSION}</span>
      </SidebarFooter>
    </Sidebar>
  )
}
