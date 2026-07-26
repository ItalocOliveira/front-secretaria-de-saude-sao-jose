import { useNavigate } from "react-router"
import { ChevronDownIcon, LogOutIcon, MonitorIcon, MoonIcon, SunIcon } from "lucide-react"

import { USER_ROLE_LABEL } from "@/lib/apac"
import { useSignOut } from "@/hooks/use-auth"
import { useSession } from "@/hooks/use-session"
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
  const signOut = useSignOut()
  const { theme, setTheme } = useTheme()
  const { claims } = useSession()

  // A API não devolve o nome do usuário: nem `GET /auth/me` nem o payload do JWT
  // trazem esse campo (ver lacunas em `.docs/integracao-api.md`). Até lá o perfil é
  // a única identidade exibível — o CPF é dado sensível e não entra na tela.
  const roleLabel = claims === null ? "Sessão" : USER_ROLE_LABEL[claims.role]

  const handleSignOut = () => {
    signOut()
    navigate("/login", { replace: true })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="lg" className="gap-2 px-1.5">
            <Avatar className="size-7">
              <AvatarFallback>{roleLabel.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="hidden flex-col items-start gap-0.5 leading-none sm:flex">
              <span className="text-sm font-medium">{roleLabel}</span>
              <span className="text-xs text-muted-foreground">Sessão ativa</span>
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
              <span>{roleLabel}</span>
              <span className="text-xs font-normal text-muted-foreground">O token expira em até 1 hora</span>
            </span>
          </DropdownMenuLabel>
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
          <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
            <LogOutIcon />
            Sair
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
