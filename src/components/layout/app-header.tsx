import { CircleQuestionMarkIcon } from "lucide-react"

import { NotificationsMenu } from "@/components/layout/notifications-menu"
import { UserMenu } from "@/components/layout/user-menu"
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

export function AppHeader({ section }: { section: string }) {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur print:hidden">
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
        <NotificationsMenu />

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
