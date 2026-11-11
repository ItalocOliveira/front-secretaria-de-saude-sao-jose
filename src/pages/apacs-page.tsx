import { useDeferredValue, useMemo, useState } from "react"
import { PlusIcon } from "lucide-react"

import { EMPTY_FILTERS, matchesFilters, type ApacFiltersValue } from "@/lib/apac-filters"
import { useApacs } from "@/hooks/use-apacs"
import { AppHeader } from "@/components/layout/app-header"
import { ApacFilters } from "@/components/apacs/apac-filters"
import { ApacFlow } from "@/components/apacs/apac-flow"
import { ApacFormSheet } from "@/components/apacs/apac-form-sheet"
import { ApacsTableCard } from "@/components/apacs/apacs-table-card"
import { ApacStats } from "@/components/apacs/apac-stats"
import { Button } from "@/components/ui/button"

const NO_APACS: never[] = []

export function ApacsPage() {
  const { data, isPending, error } = useApacs()
  const [filters, setFilters] = useState<ApacFiltersValue>(EMPTY_FILTERS)
  const [formOpen, setFormOpen] = useState(false)

  const apacs = data ?? NO_APACS

  // Filtrar não é urgente: mantém a digitação fluida quando a lista cresce.
  const deferredFilters = useDeferredValue(filters)
  const visibleApacs = useMemo(
    () => apacs.filter((apac) => matchesFilters(apac, deferredFilters)),
    [apacs, deferredFilters]
  )

  const openForm = () => setFormOpen(true)

  return (
    <>
      <AppHeader section="APACs" />

      <div className="flex flex-1 flex-col gap-6 p-4 md:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-[1.625rem] leading-tight font-bold tracking-tight">APACs</h1>
            <p className="text-muted-foreground">Autorizações de procedimentos ambulatoriais de alta complexidade.</p>
          </div>
          <Button size="lg" className="hidden md:inline-flex" onClick={openForm}>
            <PlusIcon data-icon="inline-start" />
            Nova APAC
          </Button>
        </div>

        {/* Contagens sobre a lista completa, não sobre a filtrada: o card resume a
            base, enquanto a tabela responde aos filtros. */}
        <ApacStats
          apacs={apacs}
          isPending={isPending}
          activeStatus={filters.status}
          onStatusChange={(status) => setFilters((current) => ({ ...current, status }))}
        />

        <ApacsTableCard
          apacs={visibleApacs}
          isPending={isPending}
          error={error}
          title="APACs"
          toolbar={<ApacFilters value={filters} onValueChange={setFilters} />}
          onCreate={openForm}
        />

        <ApacFlow />
      </div>

      <ApacFormSheet open={formOpen} onOpenChange={setFormOpen} />

      <Button
        size="lg"
        className="fixed right-4 bottom-4 rounded-full shadow-lg md:hidden"
        onClick={openForm}
        aria-label="Nova APAC"
      >
        <PlusIcon data-icon="inline-start" />
        Nova APAC
      </Button>
    </>
  )
}
