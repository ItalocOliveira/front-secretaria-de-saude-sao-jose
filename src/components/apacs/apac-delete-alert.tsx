import type { Apac } from "@/api/apacs"
import { useDeleteApac } from "@/hooks/use-apacs"
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

export function ApacDeleteAlert({ apac, onOpenChange }: { apac: Apac | null; onOpenChange: (open: boolean) => void }) {
  const { mutate: deleteApac, isPending, error, reset } = useDeleteApac()

  const close = () => {
    reset()
    onOpenChange(false)
  }

  const confirm = () => {
    if (apac === null) {
      return
    }

    deleteApac(apac.id, {
      onSuccess: () => {
        toast.add({ title: "APAC excluída", description: `O registro de ${apac.name} foi removido.` })
        close()
      },
    })
  }

  return (
    <AlertDialog open={apac !== null} onOpenChange={(open) => (open ? null : close())}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{apac === null ? "Excluir APAC?" : `Excluir a APAC de ${apac.name}?`}</AlertDialogTitle>
          <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
        </AlertDialogHeader>
        {error === null ? null : (
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
