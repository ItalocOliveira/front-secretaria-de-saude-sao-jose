import { canManageDocuments } from "@/lib/permissions"
import { cn } from "@/lib/utils"
import { useDocuments } from "@/hooks/use-documents"
import { useSession } from "@/hooks/use-session"
import { AppHeader } from "@/components/layout/app-header"
import { DocumentFormCard } from "@/components/documents/document-form-card"
import { DocumentsTableCard } from "@/components/documents/documents-table-card"

const NO_DOCUMENTS: never[] = []

export function DocumentsPage() {
  const { claims } = useSession()
  // `RECEPCIONISTA` só tem `POST /documents`: vê o formulário, mas não a lista (GET daria 403).
  const canManage = claims !== null && canManageDocuments(claims.role)
  const { data, isPending, error } = useDocuments({ enabled: canManage })
  const documents = data ?? NO_DOCUMENTS

  return (
    <>
      <AppHeader section="Ofícios" />

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-xl font-medium">Ofícios</h1>
          <p className="text-sm text-muted-foreground">
            {canManage
              ? "Documentos protocolados e enviados a outros setores."
              : "Protocole um ofício para envio a outros setores."}
          </p>
        </div>

        <div className={cn("grid gap-4 *:min-w-0", canManage ? "xl:grid-cols-2" : "max-w-2xl")}>
          <DocumentFormCard />
          {canManage ? <DocumentsTableCard documents={documents} isPending={isPending} error={error} /> : null}
        </div>
      </div>
    </>
  )
}
