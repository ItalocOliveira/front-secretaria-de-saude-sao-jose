import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { ArrowLeftIcon, UserPlusIcon } from "lucide-react"

import { USER_ROLE_LABEL, USER_ROLE_LIST, type UserRole } from "@/lib/apac"
import { useCreateUser } from "@/hooks/use-users"
import { AppHeader } from "@/components/layout/app-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"

const INITIAL_FORM = { name: "", cpf: "", password: "", confirmation: "", role: "" }

/** Só dígitos: a API guarda o CPF sem máscara e ele nunca deve ir para a URL. */
function onlyDigits(value: string) {
  return value.replaceAll(/\D/g, "")
}

export function NewUserPage() {
  const navigate = useNavigate()
  const { mutate: createUser, isPending, error } = useCreateUser()
  const [form, setForm] = useState(INITIAL_FORM)

  // Derivado no render, sem `useEffect`.
  const passwordMismatch = form.confirmation !== "" && form.confirmation !== form.password
  const isValid = form.role !== "" && !passwordMismatch

  const patch = (partial: Partial<typeof INITIAL_FORM>) => setForm((current) => ({ ...current, ...partial }))

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!isValid) {
      toast.add({ title: "Revise o formulário", description: "Confirme a senha e escolha um perfil de acesso." })
      return
    }

    createUser(
      {
        name: form.name,
        cpf: onlyDigits(form.cpf),
        password: form.password,
        role: form.role as UserRole,
      },
      {
        onSuccess: (user) => {
          toast.add({ title: "Usuário criado", description: `${user.name} já pode acessar o sistema.` })
          navigate("/usuarios")
        },
      }
    )
  }

  return (
    <>
      <AppHeader section="Novo usuário" />

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Novo usuário</h1>
          <p className="text-sm text-muted-foreground">Cria uma conta via POST /users.</p>
        </div>

        <Card className="max-w-xl">
          {/* O `<form>` vira o container flex do Card para preservar o espaçamento entre header/content/footer. */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-(--card-spacing)">
            <CardHeader>
              <CardTitle>Dados de acesso</CardTitle>
              <CardDescription>O CPF é a credencial de login e precisa ser único.</CardDescription>
            </CardHeader>

            <CardContent>
              <FieldGroup>
                {error === null ? null : (
                  <Alert variant="destructive">
                    <AlertTitle>Não foi possível criar a conta</AlertTitle>
                    <AlertDescription>{error.message}</AlertDescription>
                  </Alert>
                )}

                <Field>
                  <FieldLabel htmlFor="usuario-nome">Nome completo</FieldLabel>
                  <Input
                    id="usuario-nome"
                    autoComplete="name"
                    required
                    disabled={isPending}
                    value={form.name}
                    onChange={(event) => patch({ name: event.target.value })}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="usuario-cpf">CPF</FieldLabel>
                  <Input
                    id="usuario-cpf"
                    inputMode="numeric"
                    placeholder="00000000000"
                    required
                    disabled={isPending}
                    value={form.cpf}
                    onChange={(event) => patch({ cpf: event.target.value })}
                  />
                  <FieldDescription>Somente números. O CPF identifica a conta no login.</FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="usuario-perfil">Perfil de acesso</FieldLabel>
                  <Select
                    value={form.role || null}
                    onValueChange={(role: string | null) => patch({ role: role ?? "" })}
                  >
                    <SelectTrigger id="usuario-perfil" className="w-full" disabled={isPending}>
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
                  <FieldDescription>
                    Define o que a conta pode acessar — a API valida em cada requisição.
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="usuario-senha">Senha</FieldLabel>
                  <Input
                    id="usuario-senha"
                    type="password"
                    autoComplete="new-password"
                    required
                    disabled={isPending}
                    value={form.password}
                    onChange={(event) => patch({ password: event.target.value })}
                  />
                </Field>

                <Field data-invalid={passwordMismatch}>
                  <FieldLabel htmlFor="usuario-confirmacao">Confirmar senha</FieldLabel>
                  <Input
                    id="usuario-confirmacao"
                    type="password"
                    autoComplete="new-password"
                    required
                    disabled={isPending}
                    aria-invalid={passwordMismatch}
                    value={form.confirmation}
                    onChange={(event) => patch({ confirmation: event.target.value })}
                  />
                  {passwordMismatch ? <FieldDescription>As senhas não conferem.</FieldDescription> : null}
                </Field>
              </FieldGroup>
            </CardContent>

            <CardFooter className="justify-end gap-2">
              <Button variant="ghost" disabled={isPending} render={<Link to="/usuarios" />}>
                <ArrowLeftIcon data-icon="inline-start" />
                Voltar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Spinner data-icon="inline-start" /> : <UserPlusIcon data-icon="inline-start" />}
                Criar conta
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </>
  )
}
