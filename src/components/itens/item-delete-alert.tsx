import type { ItemDto } from "@/api/itens"
import { ApiError } from "@/api/client"
import { useDeleteItem } from "@/hooks/use-itens"
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
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"

export function ItemDeleteAlert({
  item,
  onOpenChange,
}: {
  item: ItemDto | null
  onOpenChange: (open: boolean) => void
}) {
  const { mutate: deleteItem, isPending, error, reset } = useDeleteItem()

  const close = () => {
    reset()
    onOpenChange(false)
  }

  const confirm = () => {
    if (item === null) {
      return
    }

    deleteItem(item.id, {
      onSuccess: () => {
        toast.add({ title: "Item excluído", description: `${item.name} foi removido do almoxarifado.` })
        close()
      },
      onError: (deleteError) => {
        // 404 = já não existe (excluído em outra aba, por ex.): aviso leve, a lista já foi invalidada.
        if (deleteError instanceof ApiError && deleteError.status === 404) {
          toast.add({ title: "Item já não existe", description: `${item.name} já havia sido excluído.` })
          close()
        }
      },
    })
  }

  return (
    <AlertDialog open={item !== null} onOpenChange={(open) => (open ? null : close())}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{item === null ? "Excluir item?" : `Excluir "${item.name}"?`}</AlertDialogTitle>
          <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
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
