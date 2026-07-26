import { useState, useTransition } from "react"
import { Link, useNavigate } from "react-router"
import { EyeIcon, EyeOffIcon, HeartPulseIcon, LogInIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"

export function LoginPage() {
  const navigate = useNavigate()
  const [cpf, setCpf] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    startTransition(async () => {
      // Placeholder de `POST /auth/login` — a camada de API ainda não existe.
      await new Promise((resolve) => setTimeout(resolve, 600))
      toast.add({ title: "Sessão iniciada", description: "Bem-vinda de volta!" })
      navigate("/apacs")
    })
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
                <Field>
                  <FieldLabel htmlFor="login-cpf">CPF</FieldLabel>
                  <Input
                    id="login-cpf"
                    inputMode="numeric"
                    autoComplete="username"
                    placeholder="000.000.000-00"
                    required
                    value={cpf}
                    onChange={(event) => setCpf(event.target.value)}
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
              <span className="text-center text-sm text-muted-foreground">
                Não tem acesso? <Link to="/cadastro">Solicite uma conta</Link>
              </span>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
