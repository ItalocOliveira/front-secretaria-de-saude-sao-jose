import { BellIcon, CircleQuestionMarkIcon } from "lucide-react"

import { UserMenu } from "@/components/layout/user-menu"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const NOTIFICATION_COUNT = 12

export function AppHeader({ section }: { section: string }) {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mr-1 h-4" />

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden sm:block">Regulação em Saúde</BreadcrumbItem>
          <BreadcrumbSeparator className="hidden sm:block" />
          <BreadcrumbItem>
            <BreadcrumbPage>{section}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
                <BellIcon />
                <Badge variant="destructive" className="absolute -top-0.5 -right-1 px-1 tabular-nums">
                  {NOTIFICATION_COUNT}
                </Badge>
              </Button>
            }
          />
          <TooltipContent>{NOTIFICATION_COUNT} notificações não lidas</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon" aria-label="Ajuda">
                <CircleQuestionMarkIcon />
              </Button>
            }
          />
          <TooltipContent>Central de ajuda</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 h-4" />
        <UserMenu />
      </div>
    </header>
  )
}
