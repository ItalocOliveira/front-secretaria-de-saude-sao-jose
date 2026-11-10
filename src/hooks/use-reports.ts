import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { getApacsReport, type ApacsReportRequest } from "@/api/reports"

export function useApacsReport(body: ApacsReportRequest) {
  return useQuery({
    // É `POST`, mas só lê: os filtros vão no corpo, então entram na chave.
    queryKey: ["reports", "apacs", body.startDate ?? null, body.endDate ?? null, body.interval ?? "day"],
    queryFn: ({ signal }) => getApacsReport(body, signal),
    // Trocar o período mantém o relatório anterior na tela até o novo chegar.
    placeholderData: keepPreviousData,
  })
}
