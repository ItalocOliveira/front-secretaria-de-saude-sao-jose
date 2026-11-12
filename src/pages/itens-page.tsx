import { useState } from "react"
import { useLocation } from "react-router"
import { SearchIcon, XIcon } from "lucide-react"

import { MAX_SEARCH_LENGTH } from "@/api/pagination"
import { readItensLocationState } from "@/lib/itens"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useItens } from "@/hooks/use-itens"
import { AppHeader } from "@/components/layout/app-header"
import { ItemCreateDialog } from "@/components/itens/item-create-dialog"
import { ItensTableCard } from "@/components/itens/itens-table-card"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"

const NO_ITENS: never[] = []
const PAGE_SIZE = 10

export function ItensPage() {
  const location = useLocation()
  const [locationKey, setLocationKey] = useState(location.key)
  const [initial, setInitial] = useState(() => readItensLocationState(location.state))
  const [search, setSearch] = useState(initial.search)
  const [page, setPage] = useState(1)

  // Nova navegação para cá (ex.: clique no sino já estando no almoxarifado): recomeça com o
  // estado que veio nela. Ajuste durante o render, sem `useEffect`.
  if (location.key !== locationKey) {
    const next = readItensLocationState(location.state)
    setLocationKey(location.key)
    setInitial(next)
    setSearch(next.search)
    setPage(1)
  }

  // Cada tecla viraria um `GET /itens`: a busca só vai para a API depois de uma pausa.
  const debouncedSearch = useDebouncedValue(search)
  const { data, isPending, isFetching, refetch, error } = useItens({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch,
  })

  const changeSearch = (next: string) => {
    setSearch(next)
    setPage(1)
  }

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
          // Remonta a cada navegação: o detalhe pedido pelo sino abre assim que o item chegar.
          key={locationKey}
          defaultSelectedId={initial.itemId}
          itens={data?.data ?? NO_ITENS}
          pagination={data?.pagination}
          onPageChange={setPage}
          isPending={isPending}
          isFetching={isFetching}
          onRefresh={() => void refetch()}
          error={error}
          isSearching={debouncedSearch.trim() !== ""}
          toolbar={
            <InputGroup className="max-w-sm">
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                aria-label="Buscar produto pelo nome"
                placeholder="Buscar pelo nome do produto"
                maxLength={MAX_SEARCH_LENGTH}
                value={search}
                onChange={(event) => changeSearch(event.target.value)}
              />
              {search ? (
                <InputGroupAddon align="inline-end">
                  <InputGroupButton size="icon-xs" aria-label="Limpar busca" onClick={() => changeSearch("")}>
                    <XIcon />
                  </InputGroupButton>
                </InputGroupAddon>
              ) : null}
            </InputGroup>
          }
        />
      </div>
    </>
  )
}
