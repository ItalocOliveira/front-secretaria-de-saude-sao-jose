import type { DateRange } from "react-day-picker"
import { format } from "date-fns"

import type { ApacListParams } from "@/api/apacs"
import { APAC_PRIORITY, APAC_STATUS, type ApacPriority, type ApacStatus } from "@/lib/apac"

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

/**
 * `location.state` aceito por `/apacs` — usado pelo sino para abrir a listagem já filtrada (e,
 * com `apacId`, o detalhe da APAC). Vai no `state` do `navigate`, **não** na query string: o nome
 * do paciente é dado pessoal e não deve parar na URL/histórico.
 */
export type ApacsLocationState = {
  search?: string
  priority?: ApacPriority
  status?: ApacStatus
  apacId?: string
}

const isOneOf = <T extends string>(values: Record<string, T>, value: unknown): value is T =>
  typeof value === "string" && Object.values(values).includes(value as T)

/** Lê o `location.state` com cuidado: pode vir de qualquer lugar (histórico, outra versão do app). */
export function readApacsLocationState(state: unknown): { filters: ApacFiltersValue; apacId: string | null } {
  if (typeof state !== "object" || state === null) {
    return { filters: EMPTY_FILTERS, apacId: null }
  }

  const { search, priority, status, apacId } = state as Record<string, unknown>
  return {
    filters: {
      ...EMPTY_FILTERS,
      search: typeof search === "string" ? search : "",
      priority: isOneOf(APAC_PRIORITY, priority) ? priority : ALL,
      status: isOneOf(APAC_STATUS, status) ? status : ALL,
    },
    apacId: typeof apacId === "string" ? apacId : null,
  }
}
