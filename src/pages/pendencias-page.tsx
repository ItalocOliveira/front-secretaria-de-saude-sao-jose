import { useMemo } from "react"

import { useApacs } from "@/hooks/use-apacs"
import { AppHeader } from "@/components/layout/app-header"
import { ApacsTableCard } from "@/components/apacs/apacs-table-card"

const NO_APACS: never[] = []

export function PendenciasPage() {
  const { data, isPending, error } = useApacs()
  const apacs = data ?? NO_APACS

  const pendentes = useMemo(() => apacs.filter((apac) => apac.status === "PENDENTE"), [apacs])

  return (
    <>
      <AppHeader section="Pendências" />

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-xl font-medium">Pendências</h1>
          <p className="text-sm text-muted-foreground">APACs aguardando análise.</p>
        </div>

        <ApacsTableCard apacs={pendentes} isPending={isPending} error={error} />
      </div>
    </>
  )
}
