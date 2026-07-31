import type { DateRange } from "react-day-picker"

import type { Apac } from "@/api/apacs"
import type { ApacPriority, ApacStatus } from "@/lib/apac"

/** Sentinela de "sem filtro" — `Select` do Base UI trata `""` como valor. */
export const ALL = "__all__"

/**
 * `GET /apacs` não documenta query params, então tudo aqui é filtro client-side
 * sobre a lista completa. Se a API ganhar filtro/paginação, este módulo é o ponto
 * de troca. O filtro de unidade saiu: unidade não existe no modelo `Apac`.
 */
export type ApacFiltersValue = {
  search: string
  status: ApacStatus | typeof ALL
  priority: ApacPriority | typeof ALL
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

export function matchesFilters(apac: Apac, filters: ApacFiltersValue) {
  const term = filters.search.trim().toLowerCase()

  // Busca só por nome e município: CNS e CPF chegam criptografados da API e nem
  // sequer entram no view model.
  if (term !== "" && ![apac.name, apac.municipality ?? ""].some((field) => field.toLowerCase().includes(term))) {
    return false
  }

  if (filters.status !== ALL && apac.status !== filters.status) {
    return false
  }

  if (filters.priority !== ALL && apac.priority !== filters.priority) {
    return false
  }

  if (filters.municipality !== ALL && apac.municipality !== filters.municipality) {
    return false
  }

  if (filters.period?.from !== undefined) {
    const createdAt = new Date(apac.createdAt)
    if (createdAt < filters.period.from) {
      return false
    }

    if (filters.period.to !== undefined && createdAt > filters.period.to) {
      return false
    }
  }

  return true
}
