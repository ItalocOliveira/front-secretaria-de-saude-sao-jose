import { useState } from "react"
import { Navigate, useLocation, useNavigate } from "react-router"
import { EyeIcon, EyeOffIcon, HeartPulseIcon, LogInIcon } from "lucide-react"

import { resolveDestination } from "@/lib/permissions"
import { decodeToken } from "@/lib/session"
import { formatCpf, onlyDigits } from "@/lib/utils"
import { useLogin } from "@/hooks/use-auth"
import { useSession } from "@/hooks/use-session"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"

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
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center justify-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <HeartPulseIcon className="size-5" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-heading font-medium">SAÚDE</span>
            <span className="text-xs text-muted-foreground">Regulação</span>
          </div>
        </div>

        <Card>
          {/* O `<form>` vira o container flex do Card para preservar o espaçamento entre header/content/footer. */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-(--card-spacing)">
            <CardHeader>
              <CardTitle>Entrar</CardTitle>
              <CardDescription>Use o CPF cadastrado na Secretaria de Saúde.</CardDescription>
            </CardHeader>

            <CardContent>
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
                    placeholder="00000000000"
                    maxLength={14}
                    required
                    disabled={isPending}
                    value={formatCpf(cpf)}
                    onChange={(event) => setCpf(onlyDigits(event.target.value, 11))}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="login-senha">Senha</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      id="login-senha"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      required
                      disabled={isPending}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        size="icon-xs"
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                        onClick={() => setShowPassword((current) => !current)}
                      >
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                  <FieldDescription>A sessão expira em 1 hora, conforme a política da API.</FieldDescription>
                </Field>
              </FieldGroup>
            </CardContent>

            <CardFooter className="flex-col items-stretch gap-3">
              <Button type="submit" disabled={isPending}>
                {isPending ? <Spinner data-icon="inline-start" /> : <LogInIcon data-icon="inline-start" />}
                Entrar
              </Button>
              {/* Não existe autocadastro no contrato: `POST /users` exige token e role. */}
              <span className="text-center text-sm text-muted-foreground">
                Contas são criadas pela Diretoria ou pela Secretaria de Saúde.
              </span>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
