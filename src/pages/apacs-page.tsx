import { useDeferredValue, useMemo, useRef, useState } from "react"
import { PlusIcon } from "lucide-react"

import { PENDING_APACS, type PendingApac } from "@/data/apacs-mock"
import { ALL, EMPTY_FILTERS, type ApacFiltersValue } from "@/lib/apac-filters"
import { AppHeader } from "@/components/layout/app-header"
import { ApacFilters } from "@/components/apacs/apac-filters"
import { ApacFlow } from "@/components/apacs/apac-flow"
import { ApacFormCard } from "@/components/apacs/apac-form-card"
import { ApacStats } from "@/components/apacs/apac-stats"
import { PendenciasCard } from "@/components/apacs/pendencias-card"
import { Button } from "@/components/ui/button"

function matches(apac: PendingApac, filters: ApacFiltersValue) {
  const term = filters.search.trim().toLowerCase()

  if (term !== "") {
    const haystack = [apac.patientName, apac.apacNumber, apac.procedureName, apac.procedureCode, apac.pendencyTitle]
    if (!haystack.some((field) => field.toLowerCase().includes(term))) {
      return false
    }
  }

  if (filters.status !== ALL && apac.status !== filters.status) {
    return false
  }

  if (filters.municipality !== ALL && apac.municipality !== filters.municipality) {
    return false
  }

  if (filters.unit !== ALL && apac.unit !== filters.unit) {
    return false
  }

  if (filters.period?.from) {
    const requestedAt = new Date(`${apac.requestedAt}T00:00:00`)
    if (requestedAt < filters.period.from) {
      return false
    }
    if (filters.period.to && requestedAt > filters.period.to) {
      return false
    }
  }

  return true
}

export function ApacsPage() {
  const [filters, setFilters] = useState<ApacFiltersValue>(EMPTY_FILTERS)
  const formRef = useRef<HTMLDivElement>(null)

  // Filtrar não é urgente: mantém a digitação fluida em listas grandes.
  const deferredFilters = useDeferredValue(filters)
  const visibleApacs = useMemo(() => PENDING_APACS.filter((apac) => matches(apac, deferredFilters)), [deferredFilters])

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

        <ApacStats />

        <ApacFilters value={filters} onValueChange={setFilters} resultCount={visibleApacs.length} />

        <div className="grid gap-4 *:min-w-0 xl:grid-cols-2">
          <ApacFormCard ref={formRef} />
          <PendenciasCard apacs={visibleApacs} />
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
