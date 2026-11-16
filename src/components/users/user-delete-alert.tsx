import type { UserDto } from "@/api/users"
import { ApiError } from "@/api/client"
import { USER_ROLE_LABEL } from "@/lib/apac"
import { useDeleteUser } from "@/hooks/use-users"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"

/**
 * Confirmação de `DELETE /users/:id`. Os erros de regra (`400` a si mesmo, `403` cargo, `409` último
 * gestor) chegam com mensagem em português da API e ficam no próprio diálogo; `404` = já excluído.
 */
export function UserDeleteAlert({
  user,
  onOpenChange,
}: {
  user: UserDto | null
  onOpenChange: (open: boolean) => void
}) {
  const { mutate: deleteUser, isPending, error, reset } = useDeleteUser()

  const close = () => {
    reset()
    onOpenChange(false)
  }

  const confirm = () => {
    if (user === null) {
      return
    }

    deleteUser(user.id, {
      onSuccess: () => {
        toast.add({ title: "Usuário excluído", description: `A conta de ${user.name} foi removida.` })
        close()
      },
      onError: (deleteError) => {
        if (deleteError instanceof ApiError && deleteError.status === 404) {
          toast.add({ title: "Usuário já não existe", description: `A conta de ${user.name} já havia sido excluída.` })
          close()
        }
      },
    })
  }

  return (
    <AlertDialog open={user !== null} onOpenChange={(open) => (open ? null : close())}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{user === null ? "Excluir usuário?" : `Excluir a conta de ${user.name}?`}</AlertDialogTitle>
          <AlertDialogDescription>
            {user === null ? null : `Perfil: ${USER_ROLE_LABEL[user.role]}. `}
            Essa ação não pode ser desfeita. Se a pessoa estiver com o sistema aberto, a sessão dela continua válida por
            até 1 hora.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error === null || (error instanceof ApiError && error.status === 404) ? null : (
          <Alert variant="destructive">
            <AlertTitle>Não foi possível excluir</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={isPending} onClick={confirm}>
            {isPending ? <Spinner data-icon="inline-start" /> : null}
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
