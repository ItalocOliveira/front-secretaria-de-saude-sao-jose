import { SearchIcon, XIcon } from "lucide-react"

import { MUNICIPALITIES } from "@/data/apacs-mock"
import {
  APAC_PRIORITY_LABEL,
  APAC_PRIORITY_LIST,
  APAC_STATUS_LABEL,
  APAC_STATUS_LIST,
  type ApacPriority,
  type ApacStatus,
} from "@/lib/apac"
import { ALL, EMPTY_FILTERS, isFiltersDirty, type ApacFiltersValue } from "@/lib/apac-filters"
import { DateRangePicker } from "@/components/apacs/date-range-picker"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function ApacFilters({
  value,
  onValueChange,
  resultCount,
}: {
  value: ApacFiltersValue
  onValueChange: (value: ApacFiltersValue) => void
  resultCount: number
}) {
  const isDirty = isFiltersDirty(value)

  const patch = (partial: Partial<ApacFiltersValue>) => onValueChange({ ...value, ...partial })

  return (
    <Card>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="apac-search">Busca</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput
                id="apac-search"
                placeholder="Buscar por paciente ou município..."
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
          </Field>

          <FieldGroup className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Field>
              <FieldLabel htmlFor="apac-status">Status</FieldLabel>
              <Select
                value={value.status}
                onValueChange={(status: ApacFiltersValue["status"] | null) => patch({ status: status ?? ALL })}
              >
                <SelectTrigger id="apac-status" className="w-full">
                  <SelectValue>
                    {(status: ApacFiltersValue["status"]) =>
                      status === ALL ? "Todos" : APAC_STATUS_LABEL[status as ApacStatus]
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value={ALL}>Todos</SelectItem>
                    {APAC_STATUS_LIST.map((status) => (
                      <SelectItem key={status} value={status}>
                        {APAC_STATUS_LABEL[status]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="apac-priority">Prioridade</FieldLabel>
              <Select
                value={value.priority}
                onValueChange={(priority: ApacFiltersValue["priority"] | null) => patch({ priority: priority ?? ALL })}
              >
                <SelectTrigger id="apac-priority" className="w-full">
                  <SelectValue>
                    {(priority: ApacFiltersValue["priority"]) =>
                      priority === ALL ? "Todas" : APAC_PRIORITY_LABEL[priority as ApacPriority]
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value={ALL}>Todas</SelectItem>
                    {APAC_PRIORITY_LIST.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {APAC_PRIORITY_LABEL[priority]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="apac-municipality">Município</FieldLabel>
              <Select
                value={value.municipality}
                onValueChange={(municipality: string | null) => patch({ municipality: municipality ?? ALL })}
              >
                <SelectTrigger id="apac-municipality" className="w-full">
                  <SelectValue>{(municipality: string) => (municipality === ALL ? "Todos" : municipality)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value={ALL}>Todos</SelectItem>
                    {MUNICIPALITIES.map((municipality) => (
                      <SelectItem key={municipality} value={municipality}>
                        {municipality}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="apac-period">Período de cadastro</FieldLabel>
              <DateRangePicker id="apac-period" value={value.period} onValueChange={(period) => patch({ period })} />
            </Field>
          </FieldGroup>
        </FieldGroup>
      </CardContent>

      <CardFooter className="justify-between gap-2">
        <span className="text-sm text-muted-foreground">
          {resultCount === 1 ? "1 APAC encontrada" : `${resultCount} APACs encontradas`}
        </span>
        <Button variant="ghost" size="sm" disabled={!isDirty} onClick={() => onValueChange(EMPTY_FILTERS)}>
          <XIcon data-icon="inline-start" />
          Limpar filtros
        </Button>
      </CardFooter>
    </Card>
  )
}
