import { useState } from "react"

import { useItens } from "@/hooks/use-itens"
import { AppHeader } from "@/components/layout/app-header"
import { ItemCreateDialog } from "@/components/itens/item-create-dialog"
import { ItensTableCard } from "@/components/itens/itens-table-card"

const NO_ITENS: never[] = []
const PAGE_SIZE = 10

export function ItensPage() {
  const [page, setPage] = useState(1)
  const { data, isPending, isFetching, refetch, error } = useItens({ page, pageSize: PAGE_SIZE })

  return (
    <>
      <AppHeader section="Almoxarifado" />

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-xl font-medium">Almoxarifado</h1>
            <p className="text-sm text-muted-foreground">Controle de estoque de itens.</p>
          </div>
          <ItemCreateDialog />
        </div>

        <ItensTableCard
          itens={data?.data ?? NO_ITENS}
          pagination={data?.pagination}
          onPageChange={setPage}
          isPending={isPending}
          isFetching={isFetching}
          onRefresh={() => void refetch()}
          error={error}
        />
      </div>
    </>
  )
}
