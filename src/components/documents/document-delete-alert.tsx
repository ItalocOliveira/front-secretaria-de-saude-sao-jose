import type { Document } from "@/api/documents"
import { ApiError } from "@/api/client"
import { useDeleteDocument } from "@/hooks/use-documents"
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

export function DocumentDeleteAlert({
  document,
  onOpenChange,
}: {
  document: Document | null
  onOpenChange: (open: boolean) => void
}) {
  const { mutate: deleteDocument, isPending, error, reset } = useDeleteDocument()

  const close = () => {
    reset()
    onOpenChange(false)
  }

  const confirm = () => {
    if (document === null) {
      return
    }

    deleteDocument(document.id, {
      onSuccess: () => {
        toast.add({
          title: "Ofício excluído",
          description: `O ofício ${document.protocolNumber} e o PDF dele foram removidos.`,
        })
        close()
      },
      onError: (deleteError) => {
        // 404 = já não existe (excluído em outra aba, por ex.): aviso leve, a lista já foi invalidada.
        if (deleteError instanceof ApiError && deleteError.status === 404) {
          toast.add({
            title: "Ofício já não existe",
            description: `O ofício ${document.protocolNumber} já havia sido excluído.`,
          })
          close()
        }
      },
    })
  }

  return (
    <AlertDialog open={document !== null} onOpenChange={(open) => (open ? null : close())}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {document === null ? "Excluir ofício?" : `Excluir o ofício ${document.protocolNumber}?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {document === null ? null : (
              <>
                <span className="font-medium text-foreground">{document.name}</span> será apagado.{" "}
              </>
            )}
            O PDF também será apagado. Essa ação não pode ser desfeita.
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
