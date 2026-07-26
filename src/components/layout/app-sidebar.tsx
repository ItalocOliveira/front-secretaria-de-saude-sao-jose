import { useState } from "react"
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
  UsersIcon,
} from "lucide-react"

import { UNITS } from "@/data/apacs-mock"
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
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

type NavItem = {
  title: string
  icon: typeof FileTextIcon
  /** Ausente enquanto a tela não existe — o item vira um botão desabilitado. */
  url?: string
  badge?: number
}

const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", icon: LayoutDashboardIcon },
  { title: "APACs", icon: FileTextIcon, url: "/apacs" },
  { title: "Pendências", icon: TriangleAlertIcon, badge: 8 },
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

  return (
    <SidebarMenu>
      {items.map((item) =>
        item.url ? (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton isActive={pathname === item.url} tooltip={item.title} render={<Link to={item.url} />}>
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
  const [unit, setUnit] = useState<string>(UNITS[0])

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="Regulação em Saúde" render={<Link to="/apacs" />}>
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
        <div className="flex flex-col gap-2">
          <span className="text-xs text-muted-foreground">Unidade</span>
          <Select value={unit} onValueChange={(next: string | null) => setUnit(next ?? UNITS[0])}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {UNITS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">Versão {APP_VERSION}</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
