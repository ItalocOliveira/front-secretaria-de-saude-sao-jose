import { SearchIcon, XIcon } from "lucide-react"

import { MUNICIPALITIES } from "@/data/apacs-mock"
import { APAC_PRIORITY_LABEL, APAC_PRIORITY_LIST, type ApacPriority } from "@/lib/apac"
import { ALL, EMPTY_FILTERS, isFiltersDirty, type ApacFiltersValue } from "@/lib/apac-filters"
import { DateRangePicker } from "@/components/apacs/date-range-picker"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

/**
 * Barra de filtros em uma linha, dentro do bloco da tabela. Sem rótulos visíveis:
 * cada controle diz o que é pelo próprio valor ("Todas as prioridades"), e o rótulo
 * fica no `aria-label`. O status é filtrado pelos cards de indicador, não aqui.
 */
export function ApacFilters({
  value,
  onValueChange,
}: {
  value: ApacFiltersValue
  onValueChange: (value: ApacFiltersValue) => void
}) {
  const isDirty = isFiltersDirty(value)

  const patch = (partial: Partial<ApacFiltersValue>) => onValueChange({ ...value, ...partial })

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <InputGroup className="min-w-0 flex-[1_1_220px]">
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          aria-label="Buscar APAC"
          placeholder="Buscar por paciente ou município"
          value={value.search}
          onChange={(event) => patch({ search: event.target.value })}
        />
        {value.search ? (
          <InputGroupAddon align="inline-end">
            <InputGroupButton size="icon-xs" aria-label="Limpar busca" onClick={() => patch({ search: "" })}>
              <XIcon />
            </InputGroupButton>
          </InputGroupAddon>
        ) : null}
      </InputGroup>

      <Select
        value={value.priority}
        onValueChange={(priority: ApacFiltersValue["priority"] | null) => patch({ priority: priority ?? ALL })}
      >
        <SelectTrigger aria-label="Prioridade" className="w-full sm:w-44">
          <SelectValue>
            {(priority: ApacFiltersValue["priority"]) =>
              priority === ALL ? "Todas as prioridades" : APAC_PRIORITY_LABEL[priority as ApacPriority]
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value={ALL}>Todas as prioridades</SelectItem>
            {APAC_PRIORITY_LIST.map((priority) => (
              <SelectItem key={priority} value={priority}>
                {APAC_PRIORITY_LABEL[priority]}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select
        value={value.municipality}
        onValueChange={(municipality: string | null) => patch({ municipality: municipality ?? ALL })}
      >
        <SelectTrigger aria-label="Município" className="w-full sm:w-48">
          <SelectValue>
            {(municipality: string) => (municipality === ALL ? "Todos os municípios" : municipality)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value={ALL}>Todos os municípios</SelectItem>
            {MUNICIPALITIES.map((municipality) => (
              <SelectItem key={municipality} value={municipality}>
                {municipality}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <div className="w-full sm:w-56">
        <DateRangePicker value={value.period} onValueChange={(period) => patch({ period })} />
      </div>

      {/* Só aparece com filtro ativo: um botão que não faz nada na maior parte do tempo é ruído. */}
      {isDirty ? (
        <Button variant="ghost" onClick={() => onValueChange(EMPTY_FILTERS)}>
          Limpar filtros
        </Button>
      ) : null}
    </div>
  )
}
