import { useState, useTransition } from "react"
import { Link, useNavigate } from "react-router"
import { HeartPulseIcon, UserPlusIcon } from "lucide-react"

import { USER_ROLE_LABEL, USER_ROLE_LIST, type UserRole } from "@/lib/apac"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"

const INITIAL_FORM = { name: "", cpf: "", password: "", confirmation: "", role: "" }

export function SignupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(INITIAL_FORM)
  const [isPending, startTransition] = useTransition()

  const passwordMismatch = form.confirmation !== "" && form.confirmation !== form.password

  const patch = (partial: Partial<typeof INITIAL_FORM>) => setForm((current) => ({ ...current, ...partial }))

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (passwordMismatch) {
      toast.add({ title: "Senhas diferentes", description: "Confirme a senha corretamente." })
      return
    }

    startTransition(async () => {
      // Placeholder de `POST /users` — a camada de API ainda não existe.
      await new Promise((resolve) => setTimeout(resolve, 600))
      toast.add({ title: "Conta criada", description: `${form.name} já pode acessar o sistema.` })
      navigate("/login")
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
              <CardTitle>Criar conta</CardTitle>
              <CardDescription>Novas contas são criadas por Diretoria ou Secretaria.</CardDescription>
            </CardHeader>

            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="cadastro-nome">Nome completo</FieldLabel>
                  <Input
                    id="cadastro-nome"
                    autoComplete="name"
                    required
                    value={form.name}
                    onChange={(event) => patch({ name: event.target.value })}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="cadastro-cpf">CPF</FieldLabel>
                  <Input
                    id="cadastro-cpf"
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    required
                    value={form.cpf}
                    onChange={(event) => patch({ cpf: event.target.value })}
                  />
                  <FieldDescription>O CPF é único e identifica a conta no login.</FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="cadastro-perfil">Perfil de acesso</FieldLabel>
                  <Select
                    value={form.role || null}
                    onValueChange={(role: string | null) => patch({ role: role ?? "" })}
                  >
                    <SelectTrigger id="cadastro-perfil" className="w-full">
                      <SelectValue placeholder="Selecione o perfil">
                        {(role: string | null) => (role ? USER_ROLE_LABEL[role as UserRole] : "Selecione o perfil")}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {USER_ROLE_LIST.map((role) => (
                          <SelectItem key={role} value={role}>
                            {USER_ROLE_LABEL[role]}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel htmlFor="cadastro-senha">Senha</FieldLabel>
                  <Input
                    id="cadastro-senha"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={form.password}
                    onChange={(event) => patch({ password: event.target.value })}
                  />
                </Field>

                <Field data-invalid={passwordMismatch}>
                  <FieldLabel htmlFor="cadastro-confirmacao">Confirmar senha</FieldLabel>
                  <Input
                    id="cadastro-confirmacao"
                    type="password"
                    autoComplete="new-password"
                    required
                    aria-invalid={passwordMismatch}
                    value={form.confirmation}
                    onChange={(event) => patch({ confirmation: event.target.value })}
                  />
                  {passwordMismatch ? <FieldDescription>As senhas não conferem.</FieldDescription> : null}
                </Field>
              </FieldGroup>
            </CardContent>

            <CardFooter className="flex-col items-stretch gap-3">
              <Button type="submit" disabled={isPending}>
                {isPending ? <Spinner data-icon="inline-start" /> : <UserPlusIcon data-icon="inline-start" />}
                Criar conta
              </Button>
              <span className="text-center text-sm text-muted-foreground">
                Já tem conta? <Link to="/login">Entrar</Link>
              </span>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
