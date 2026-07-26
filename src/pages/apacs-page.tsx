import { useDeferredValue, useMemo, useRef, useState } from "react"
import { PlusIcon } from "lucide-react"

import { EMPTY_FILTERS, matchesFilters, type ApacFiltersValue } from "@/lib/apac-filters"
import { useApacs } from "@/hooks/use-apacs"
import { AppHeader } from "@/components/layout/app-header"
import { ApacFilters } from "@/components/apacs/apac-filters"
import { ApacFlow } from "@/components/apacs/apac-flow"
import { ApacFormCard } from "@/components/apacs/apac-form-card"
import { ApacsTableCard } from "@/components/apacs/apacs-table-card"
import { ApacStats } from "@/components/apacs/apac-stats"
import { Button } from "@/components/ui/button"

const NO_APACS: never[] = []

export function ApacsPage() {
  const { data, isPending, error } = useApacs()
  const [filters, setFilters] = useState<ApacFiltersValue>(EMPTY_FILTERS)
  const formRef = useRef<HTMLDivElement>(null)

  const apacs = data ?? NO_APACS

  // Filtrar não é urgente: mantém a digitação fluida quando a lista cresce.
  const deferredFilters = useDeferredValue(filters)
  const visibleApacs = useMemo(
    () => apacs.filter((apac) => matchesFilters(apac, deferredFilters)),
    [apacs, deferredFilters]
  )

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <>
      <AppHeader section="APACs" />

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-xl font-medium">APACs</h1>
            <p className="text-sm text-muted-foreground">
              Autorizações de procedimentos ambulatoriais de alta complexidade.
            </p>
          </div>
          <Button className="hidden md:inline-flex" onClick={scrollToForm}>
            <PlusIcon data-icon="inline-start" />
            Nova APAC
          </Button>
        </div>

        {/* Contagens sobre a lista completa, não sobre a filtrada: o card resume a
            base, enquanto a tabela responde aos filtros. */}
        <ApacStats apacs={apacs} isPending={isPending} />

        <ApacFilters value={filters} onValueChange={setFilters} resultCount={visibleApacs.length} />

        <div className="grid gap-4 *:min-w-0 xl:grid-cols-2">
          <ApacFormCard ref={formRef} />
          <ApacsTableCard apacs={visibleApacs} isPending={isPending} error={error} />
        </div>

        <ApacFlow />
      </div>

      <Button
        size="lg"
        className="fixed right-4 bottom-4 rounded-full shadow-lg md:hidden"
        onClick={scrollToForm}
        aria-label="Nova APAC"
      >
        <PlusIcon data-icon="inline-start" />
        Nova APAC
      </Button>
    </>
  )
}
