import { Link } from "react-router"
import { UserPlusIcon, UsersIcon } from "lucide-react"

import { USER_ROLE_LABEL } from "@/lib/apac"
import { useUsers } from "@/hooks/use-users"
import { AppHeader } from "@/components/layout/app-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" })

function formatDate(value: string | undefined) {
  if (value === undefined) {
    return "—"
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "—" : DATE_FORMATTER.format(date)
}

export function UsersPage() {
  const { data: users, isPending, error } = useUsers()

  return (
    <>
      <AppHeader section="Usuários" />

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">Usuários</h1>
            <p className="text-sm text-muted-foreground">Contas com acesso ao sistema de regulação.</p>
          </div>
          <Button render={<Link to="/usuarios/novo" />}>
            <UserPlusIcon data-icon="inline-start" />
            Novo usuário
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Contas cadastradas</CardTitle>
            <CardDescription>Dados vindos de GET /users.</CardDescription>
          </CardHeader>

          <CardContent>
            {error === null ? null : (
              <Alert variant="destructive">
                <AlertTitle>Não foi possível carregar os usuários</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            )}

            {isPending ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 4 }, (_, index) => (
                  <Skeleton key={index} className="h-10 w-full" />
                ))}
              </div>
            ) : null}

            {users !== undefined && users.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <UsersIcon />
                  </EmptyMedia>
                  <EmptyTitle>Nenhum usuário cadastrado</EmptyTitle>
                  <EmptyDescription>Crie a primeira conta em "Novo usuário".</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : null}

            {users !== undefined && users.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead>Criada em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        {/* O CPF chega criptografado da API e é dado pessoal — não vai para a tela. */}
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{USER_ROLE_LABEL[user.role]}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground tabular-nums">
                          {formatDate(user.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
