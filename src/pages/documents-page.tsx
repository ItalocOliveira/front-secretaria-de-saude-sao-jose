import { useDocuments } from "@/hooks/use-documents"
import { AppHeader } from "@/components/layout/app-header"
import { DocumentFormCard } from "@/components/documents/document-form-card"
import { DocumentsTableCard } from "@/components/documents/documents-table-card"

const NO_DOCUMENTS: never[] = []

export function DocumentsPage() {
  const { data, isPending, error } = useDocuments()
  const documents = data ?? NO_DOCUMENTS

  return (
    <>
      <AppHeader section="Ofícios" />

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-xl font-medium">Ofícios</h1>
          <p className="text-sm text-muted-foreground">Documentos protocolados e enviados a outros setores.</p>
        </div>

        <div className="grid gap-4 *:min-w-0 xl:grid-cols-2">
          <DocumentFormCard />
          <DocumentsTableCard documents={documents} isPending={isPending} error={error} />
        </div>
      </div>
    </>
  )
}
