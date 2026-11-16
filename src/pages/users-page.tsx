import { useState } from "react"
import { Link } from "react-router"
import { Trash2Icon, UserPlusIcon, UsersIcon } from "lucide-react"

import type { UserDto } from "@/api/users"
import { USER_ROLE_LABEL } from "@/lib/apac"
import { canDeleteUser, USER_DELETE_ROLES } from "@/lib/permissions"
import { useSession } from "@/hooks/use-session"
import { useUsers } from "@/hooks/use-users"
import { UserDeleteAlert } from "@/components/users/user-delete-alert"
import { Button } from "@/components/ui/button"
import { AppHeader } from "@/components/layout/app-header"
import { ListPagination } from "@/components/list-pagination"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/variants/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const PAGE_SIZE = 20

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" })

function formatDate(value: string | undefined) {
  if (value === undefined) {
    return "—"
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "—" : DATE_FORMATTER.format(date)
}

export function UsersPage() {
  const [page, setPage] = useState(1)
  // Ordem alfabética, vinda da API.
  const { data, isPending, error } = useUsers({ page, pageSize: PAGE_SIZE })
  const users = data?.data
  const { claims } = useSession()
  // Coluna de ações só para quem pode excluir (`DEV`/`SECRETARIO`); a própria conta nunca tem o botão.
  const showActions = claims !== null && USER_DELETE_ROLES.includes(claims.role)
  const [deleting, setDeleting] = useState<UserDto | null>(null)

  return (
    <>
      <AppHeader section="Usuários" />

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">Usuários</h1>
            <p className="text-sm text-muted-foreground">Contas com acesso ao sistema de regulação.</p>
          </div>
          <Link to="/usuarios/novo" data-slot="button" className={buttonVariants()}>
            <UserPlusIcon data-icon="inline-start" />
            Novo usuário
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Contas cadastradas</CardTitle>
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
                      {showActions ? (
                        <TableHead>
                          <span className="sr-only">Ações</span>
                        </TableHead>
                      ) : null}
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
                        {showActions ? (
                          <TableCell className="w-0">
                            {claims !== null && user.id !== claims.id && canDeleteUser(claims.role, user.role) ? (
                              <Tooltip>
                                <TooltipTrigger
                                  render={
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      aria-label={`Excluir a conta de ${user.name}`}
                                      onClick={() => setDeleting(user)}
                                    >
                                      <Trash2Icon />
                                    </Button>
                                  }
                                />
                                <TooltipContent>Excluir</TooltipContent>
                              </Tooltip>
                            ) : null}
                          </TableCell>
                        ) : null}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : null}
          </CardContent>

          {data !== undefined && data.pagination.total > 0 ? (
            <ListPagination pagination={data.pagination} label="usuários" onPageChange={setPage} />
          ) : null}
        </Card>
      </div>

      <UserDeleteAlert user={deleting} onOpenChange={(open) => (open ? null : setDeleting(null))} />
    </>
  )
}
