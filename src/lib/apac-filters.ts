import type { DateRange } from "react-day-picker"
import { format } from "date-fns"

import type { ApacListParams } from "@/api/apacs"
import type { ApacPriority, ApacStatus } from "@/lib/apac"

/** Sentinela de "sem filtro" — `Select` do Base UI trata `""` como valor. */
export const ALL = "__all__"

/**
 * Filtros da listagem de APACs. Todos vão para a query string de `GET /apacs` (ver
 * `toApacListFilters`) — a lista é paginada, então filtrar no navegador pegaria só a página
 * carregada e deixaria o `total` errado.
 */
export type ApacFiltersValue = {
  search: string
  status: ApacStatus | typeof ALL
  priority: ApacPriority | typeof ALL
  /** Nome do município, `MUNICIPALITY_NOT_INFORMED` ou `ALL`. */
  municipality: string
  period: DateRange | undefined
}

export const EMPTY_FILTERS: ApacFiltersValue = {
  search: "",
  status: ALL,
  priority: ALL,
  municipality: ALL,
  period: undefined,
}

export function isFiltersDirty(value: ApacFiltersValue) {
  return (
    value.search !== "" ||
    value.status !== ALL ||
    value.priority !== ALL ||
    value.municipality !== ALL ||
    value.period !== undefined
  )
}

/** `YYYY-MM-DD` do dia local — a API interpreta como o dia inteiro no horário da Paraíba. */
const toApiDate = (date: Date | undefined) => (date === undefined ? undefined : format(date, "yyyy-MM-dd"))

/**
 * Converte os filtros da tela nos parâmetros de `GET /apacs`. `search` fica de fora: a tela
 * aplica debounce nele antes de mandar. Período aberto ("a partir de") manda só `startDate`.
 */
export function toApacListFilters(value: ApacFiltersValue): Omit<ApacListParams, "page" | "pageSize" | "search"> {
  return {
    status: value.status === ALL ? undefined : value.status,
    priority: value.priority === ALL ? undefined : value.priority,
    municipality: value.municipality === ALL ? undefined : value.municipality,
    startDate: toApiDate(value.period?.from),
    endDate: toApiDate(value.period?.to),
  }
}
