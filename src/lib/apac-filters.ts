import type { DateRange } from "react-day-picker"

import type { ApacStatus } from "@/lib/apac"

/** Sentinela de "sem filtro" — `Select` do Base UI trata `""` como valor. */
export const ALL = "__all__"

export type ApacFiltersValue = {
  search: string
  status: ApacStatus | typeof ALL
  municipality: string
  unit: string
  period: DateRange | undefined
}

export const EMPTY_FILTERS: ApacFiltersValue = {
  search: "",
  status: ALL,
  municipality: ALL,
  unit: ALL,
  period: undefined,
}

export function isFiltersDirty(value: ApacFiltersValue) {
  return (
    value.search !== "" || value.status !== ALL || value.municipality !== ALL || value.unit !== ALL || !!value.period
  )
}
