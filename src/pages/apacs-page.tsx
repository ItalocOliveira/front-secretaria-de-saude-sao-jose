import { useState } from "react"
import { useLocation } from "react-router"
import { PlusIcon } from "lucide-react"

import { readApacsLocationState, toApacListFilters, type ApacFiltersValue } from "@/lib/apac-filters"
import { useApacs } from "@/hooks/use-apacs"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useApacsReport } from "@/hooks/use-reports"
import { AppHeader } from "@/components/layout/app-header"
import { ApacFilters } from "@/components/apacs/apac-filters"
import { ApacFlow } from "@/components/apacs/apac-flow"
import { ApacFormSheet } from "@/components/apacs/apac-form-sheet"
import { ApacsTableCard } from "@/components/apacs/apacs-table-card"
import { ApacStats } from "@/components/apacs/apac-stats"
import { Button } from "@/components/ui/button"

const NO_APACS: never[] = []
const PAGE_SIZE = 6
/** Corpo vazio = mês atual; aqui só interessa o `countByStatus`, que ignora o período. */
const STATS_REPORT_REQUEST = {}

export function ApacsPage() {
  const location = useLocation()
  const [locationKey, setLocationKey] = useState(location.key)
  const [initial, setInitial] = useState(() => readApacsLocationState(location.state))
  const [filters, setFilters] = useState<ApacFiltersValue>(initial.filters)
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)

  // Nova navegação para cá (ex.: clique no sino já estando em APACs): recomeça com os filtros que
  // vieram no `location.state`. Ajuste durante o render, sem `useEffect`.
  if (location.key !== locationKey) {
    const next = readApacsLocationState(location.state)
    setLocationKey(location.key)
    setInitial(next)
    setFilters(next.filters)
    setPage(1)
  }

  // Cada tecla viraria um `GET /apacs`: a busca só vai para a API depois de uma pausa.
  const search = useDebouncedValue(filters.search)
  const { data, isPending, isFetching, refetch, error } = useApacs({
    page,
    pageSize: PAGE_SIZE,
    search,
    ...toApacListFilters(filters),
  })
  const report = useApacsReport(STATS_REPORT_REQUEST)

  // Filtro novo sempre volta para a página 1 (a atual pode nem existir no resultado novo).
  const changeFilters = (next: ApacFiltersValue) => {
    setFilters(next)
    setPage(1)
  }

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

        {/* Contagens da base inteira (relatório), não da página: o card resume a base,
            enquanto a tabela responde à busca. */}
        <ApacStats
          countByStatus={report.data?.countByStatus}
          isPending={report.isPending}
          activeStatus={filters.status}
          onStatusChange={(status) => changeFilters({ ...filters, status })}
        />

        <ApacsTableCard
          // Remonta a cada navegação: o detalhe pedido pelo sino abre assim que a APAC chegar.
          key={locationKey}
          defaultSelectedId={initial.apacId}
          apacs={data?.data ?? NO_APACS}
          pagination={data?.pagination}
          onPageChange={setPage}
          isPending={isPending}
          isFetching={isFetching}
          onRefresh={() => {
            void refetch()
            void report.refetch()
          }}
          error={error}
          title="APACs"
          toolbar={<ApacFilters value={filters} onValueChange={changeFilters} />}
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
