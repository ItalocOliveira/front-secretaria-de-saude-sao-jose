import { useState } from "react"
import { Navigate, useLocation, useNavigate } from "react-router"
import { EyeIcon, EyeOffIcon, LogInIcon, SunMoonIcon } from "lucide-react"

import { resolveDestination } from "@/lib/permissions"
import { decodeToken } from "@/lib/session"
import { formatCpf, onlyDigits } from "@/lib/utils"
import { useLogin } from "@/hooks/use-auth"
import { useSession } from "@/hooks/use-session"
import { useTheme } from "@/components/theme-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"

const MODULES = [
  { title: "APACs", description: "Registro e acompanhamento por status" },
  { title: "Almoxarifado", description: "Entradas, saídas e saldo de materiais" },
  { title: "Ofícios", description: "Emissão e controle de documentos" },
]

const PULSE_PATH = "M0 80 H250 L272 80 L286 56 L300 80 L318 80 L334 12 L352 128 L368 80 L392 80 L410 64 L428 80 H800"

// Painel institucional (só em telas largas). Estático: fica fora do componente da página.
function BrandPanel() {
  return (
    <aside
      aria-label="Sobre o ICOS"
      className="relative hidden flex-col justify-between overflow-hidden bg-brand-panel px-[clamp(2rem,5vw,4.5rem)] py-14 text-brand-panel-foreground lg:flex"
    >
      <img
        src="/logo_prefeitura.png"
        alt=""
        className="pointer-events-none absolute top-[60%] right-[7%] w-[min(36%,300px)] -translate-y-1/2 opacity-15 grayscale"
      />

      <div className="relative flex max-w-120 flex-col gap-3">
        <img src="/logo_secretaria.png" alt="" className="mb-4 size-18 object-contain" />
        <h2 className="text-[clamp(1.75rem,2.6vw,2.5rem)] leading-tight font-extrabold tracking-tight">
          Interface de Controle Operacional da Saúde
        </h2>
        <p className="max-w-[42ch] text-brand-panel-muted">
          APACs, estoque e documentos da Secretaria reunidos em um só lugar.
        </p>
      </div>

      <svg
        viewBox="0 0 800 140"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/2 h-35 w-full -translate-y-[30%] fill-none stroke-[2.5] [stroke-linecap:round] [stroke-linejoin:round]"
      >
        <path d={PULSE_PATH} className="stroke-brand-panel-border" />
        <path
          d={PULSE_PATH}
          className="animate-draw-line stroke-brand-accent [stroke-dasharray:1400] [stroke-dashoffset:1400] motion-reduce:animate-none motion-reduce:[stroke-dashoffset:0]"
        />
      </svg>

      <ul className="relative grid grid-cols-3 border-t border-brand-panel-border">
        {MODULES.map((module) => (
          <li
            key={module.title}
            className="flex flex-col gap-1 pt-5 pr-5 not-first:border-l not-first:border-brand-panel-border not-first:pl-5"
          >
            <strong className="text-[0.9375rem] font-semibold">{module.title}</strong>
            <span className="text-[0.8125rem] leading-snug text-brand-panel-muted">{module.description}</span>
          </li>
        ))}
      </ul>
    </aside>
  )
}

function ThemeToggle() {
  const { setTheme } = useTheme()

  // O tema efetivo (inclusive "system") é o que está aplicado no <html>.
  const toggle = () => setTheme(document.documentElement.classList.contains("dark") ? "light" : "dark")

  return (
    <Button type="button" variant="outline" size="xs" onClick={toggle}>
      <SunMoonIcon data-icon="inline-start" />
      Alternar tema
    </Button>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { claims } = useSession()
  const { mutate: signIn, isPending, error } = useLogin()

  const [cpf, setCpf] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  // `RequireAuth` guarda o caminho de origem no state da navegação.
  const from = (location.state as { from?: string } | null)?.from

  // Já autenticado não vê o formulário — evita login duplicado e volta pra área certa.
  if (claims !== null) {
    return <Navigate to={resolveDestination(from, claims.role)} replace />
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    signIn(
      { cpf, password },
      {
        onSuccess: (data) => {
          const nextClaims = decodeToken(data.token)
          if (nextClaims === null) {
            return
          }

          navigate(resolveDestination(from, nextClaims.role), { replace: true })
        },
      }
    )
  }

  return (
    <main className="grid min-h-svh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <section className="flex flex-col bg-background p-6 sm:px-[clamp(1.5rem,6vw,4.5rem)] sm:py-8">
        <header className="flex items-center gap-3">
          <img src="/logo_secretaria.png" alt="" className="size-10 shrink-0 object-contain" />
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="text-xl font-extrabold tracking-tight">ICOS</span>
            <span className="text-[0.8125rem] text-muted-foreground">São José dos Ramos</span>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-100 flex-1 flex-col justify-center py-12">
          <h1 className="mb-1.5 text-[1.75rem] leading-tight font-bold tracking-tight">Entrar</h1>
          <p className="mb-8 text-muted-foreground">Use o CPF cadastrado na Secretaria de Saúde.</p>

          <form onSubmit={handleSubmit}>
            <FieldGroup>
              {error === null ? null : (
                <Alert variant="destructive">
                  <AlertTitle>Não foi possível entrar</AlertTitle>
                  {/* Só a mensagem normalizada: o corpo cru do erro pode conter dados sensíveis. */}
                  <AlertDescription>{error.message}</AlertDescription>
                </Alert>
              )}

              <Field>
                <FieldLabel htmlFor="login-cpf">CPF</FieldLabel>
                <Input
                  id="login-cpf"
                  inputMode="numeric"
                  autoComplete="username"
                  placeholder="000.000.000-00"
                  maxLength={14}
                  required
                  disabled={isPending}
                  className="h-12 tabular-nums"
                  value={formatCpf(cpf)}
                  onChange={(event) => setCpf(onlyDigits(event.target.value, 11))}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="login-senha">Senha</FieldLabel>
                <InputGroup className="h-12">
                  <InputGroupInput
                    id="login-senha"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Sua senha"
                    required
                    disabled={isPending}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      size="icon-sm"
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword((current) => !current)}
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
              </Field>

              <Button type="submit" size="lg" className="h-12 w-full" disabled={isPending}>
                {isPending ? <Spinner data-icon="inline-start" /> : <LogInIcon data-icon="inline-start" />}
                {isPending ? "Entrando…" : "Entrar"}
              </Button>
            </FieldGroup>
          </form>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <img src="/logo_prefeitura.png" alt="Brasão de São José dos Ramos" className="h-7 w-auto shrink-0" />
            <span className="leading-tight">
              Prefeitura de São José dos Ramos
              <br />
              Secretaria Municipal de Saúde
            </span>
          </div>
          <ThemeToggle />
        </footer>
      </section>

      <BrandPanel />
    </main>
  )
}
