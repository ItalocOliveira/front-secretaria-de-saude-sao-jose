import { useState } from "react"

import { APAC_STATUS } from "@/lib/apac"
import { useApacs } from "@/hooks/use-apacs"
import { AppHeader } from "@/components/layout/app-header"
import { ApacsTableCard } from "@/components/apacs/apacs-table-card"

const NO_APACS: never[] = []
const PAGE_SIZE = 10

export function PendenciasPage() {
  const [page, setPage] = useState(1)
  // O filtro de status vai para a API: a listagem é paginada, filtrar a página carregada perderia APACs.
  const { data, isPending, isFetching, refetch, error } = useApacs({
    page,
    pageSize: PAGE_SIZE,
    status: APAC_STATUS.PENDENTE,
  })

  return (
    <>
      <AppHeader section="Pendências" />

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-xl font-medium">Pendências</h1>
          <p className="text-sm text-muted-foreground">APACs aguardando análise.</p>
        </div>

        <ApacsTableCard
          apacs={data?.data ?? NO_APACS}
          pagination={data?.pagination}
          onPageChange={setPage}
          isPending={isPending}
          isFetching={isFetching}
          onRefresh={() => void refetch()}
          error={error}
          emptyDescription="Nenhuma APAC pendente no momento."
        />
      </div>
    </>
  )
}
