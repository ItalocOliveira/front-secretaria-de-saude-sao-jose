import type { ItemDto } from "@/api/itens"
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
    })
  }

  return (
    <AlertDialog open={item !== null} onOpenChange={(open) => (open ? null : close())}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{item === null ? "Excluir item?" : `Excluir "${item.name}"?`}</AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação não pode ser desfeita.{error === null ? "" : ` ${error.message}`}
          </AlertDialogDescription>
        </AlertDialogHeader>
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
