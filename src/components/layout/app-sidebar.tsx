import { Link, useLocation } from "react-router"
import {
  ChartColumnIcon,
  FileSignatureIcon,
  FileTextIcon,
  HistoryIcon,
  LayoutDashboardIcon,
  MailIcon,
  MessageCircleIcon,
  PackageIcon,
  TriangleAlertIcon,
  UserCogIcon,
} from "lucide-react"

import type { UserRole } from "@/lib/apac"
import {
  APAC_ROLES,
  AUDIT_ROLES,
  DASHBOARD_ROLES,
  DOCUMENT_ROLES,
  homeRouteFor,
  ITEM_ROLES,
  REPORT_ROLES,
  USER_MANAGEMENT_ROLES,
} from "@/lib/permissions"
import { useSession } from "@/hooks/use-session"
import { useTenantName } from "@/hooks/use-tenant"
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
  { title: "Dashboard", icon: LayoutDashboardIcon, url: "/dashboard", roles: DASHBOARD_ROLES },
  { title: "APACs", icon: FileTextIcon, url: "/apacs", roles: APAC_ROLES },
  { title: "Pendências", icon: TriangleAlertIcon, url: "/pendencias", roles: APAC_ROLES },
  { title: "Usuários", icon: UserCogIcon, url: "/usuarios", roles: USER_MANAGEMENT_ROLES },
  { title: "Almoxarifado", icon: PackageIcon, url: "/almoxarifado", roles: ITEM_ROLES },
  { title: "Ofícios", icon: FileSignatureIcon, url: "/documents", roles: DOCUMENT_ROLES },
  { title: "Relatórios", icon: ChartColumnIcon, url: "/relatorios", roles: REPORT_ROLES },
  { title: "Auditoria", icon: HistoryIcon, url: "/auditoria", roles: AUDIT_ROLES },
]

const SUPPORT_EMAIL = "italo.oliveira@wirgo.com.br"
// Abre o Gmail já com o destinatário preenchido (mailto depende de um cliente de e-mail configurado).
const SUPPORT_EMAIL_URL = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(SUPPORT_EMAIL)}`

const SUPPORT_WHATSAPP_LABEL = "+55 (83) 9379-4071"
const SUPPORT_WHATSAPP_MESSAGE = "Olá, gostaria de iniciar um atendimento de suporte."
const SUPPORT_WHATSAPP_URL = `https://wa.me/558393794071?text=${encodeURIComponent(SUPPORT_WHATSAPP_MESSAGE)}`

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
  // Município do endereço: deixa claro em qual prefeitura a pessoa está logada.
  const tenantName = useTenantName()

  // Nem todo perfil enxerga APACs, então o logo leva para a home de cada um.
  const homeRoute = claims === null ? "/" : homeRouteFor(claims.role)

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="ICOS" render={<Link to={homeRoute} />}>
              <img src="/logo_icos.png" alt="" className="size-8 shrink-0 object-contain" />
              <div className="flex min-w-0 flex-col gap-0.5 leading-none">
                <span className="truncate text-xl font-bold tracking-wide">ICOS</span>
                {tenantName === undefined ? null : (
                  <span className="truncate text-xs text-muted-foreground">{tenantName}</span>
                )}
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
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip={SUPPORT_EMAIL}
                  render={<a href={SUPPORT_EMAIL_URL} target="_blank" rel="noopener noreferrer" />}
                >
                  <MailIcon />
                  <span className="truncate">{SUPPORT_EMAIL}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip={`WhatsApp ${SUPPORT_WHATSAPP_LABEL}`}
                  render={<a href={SUPPORT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" />}
                >
                  <MessageCircleIcon />
                  <span className="truncate">{SUPPORT_WHATSAPP_LABEL}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
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
