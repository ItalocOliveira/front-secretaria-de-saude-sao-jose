import { useNavigate } from "react-router"
import { ChevronDownIcon, LogOutIcon, MonitorIcon, MoonIcon, SunIcon, UserIcon } from "lucide-react"

import { CURRENT_USER } from "@/data/apacs-mock"
import { getInitials, USER_ROLE_LABEL } from "@/lib/apac"
import { useTheme } from "@/components/theme-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const THEME_OPTIONS = [
  { value: "light", label: "Claro", icon: SunIcon },
  { value: "dark", label: "Escuro", icon: MoonIcon },
  { value: "system", label: "Sistema", icon: MonitorIcon },
] as const

export function UserMenu() {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="lg" className="gap-2 px-1.5">
            <Avatar className="size-7">
              <AvatarFallback>{getInitials(CURRENT_USER.name)}</AvatarFallback>
            </Avatar>
            <span className="hidden flex-col items-start gap-0.5 leading-none sm:flex">
              <span className="text-sm font-medium">{CURRENT_USER.name}</span>
              <span className="text-xs text-muted-foreground">{USER_ROLE_LABEL[CURRENT_USER.role]}</span>
            </span>
            <ChevronDownIcon data-icon="inline-end" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        {/* `DropdownMenuLabel` é o `Menu.GroupLabel` do Base UI: sem um `Group`/`RadioGroup` ao redor,
            ele lança em runtime. Todo label precisa viver dentro do grupo que ele nomeia. */}
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <span className="flex flex-col gap-0.5">
              <span>{CURRENT_USER.name}</span>
              <span className="text-xs font-normal text-muted-foreground">{CURRENT_USER.unit}</span>
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <UserIcon />
            Meu perfil
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as typeof theme)}>
          <DropdownMenuLabel>Tema</DropdownMenuLabel>
          {THEME_OPTIONS.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              <option.icon />
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive" onClick={() => navigate("/login")}>
            <LogOutIcon />
            Sair
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
