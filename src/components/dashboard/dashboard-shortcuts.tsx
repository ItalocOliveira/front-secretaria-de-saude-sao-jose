import { Link } from "react-router"
import { ArrowLeftRightIcon, ChartColumnIcon, FileSignatureIcon, PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/variants/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const LINKS = [
  { to: "/documents", label: "Novo ofício", icon: FileSignatureIcon },
  { to: "/almoxarifado", label: "Entrada/saída", icon: ArrowLeftRightIcon },
  { to: "/relatorios", label: "Relatório", icon: ChartColumnIcon },
] as const

/** Atalhos para as ações mais comuns. "Nova APAC" abre o formulário aqui mesmo. */
export function DashboardShortcuts({ onCreateApac }: { onCreateApac: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Atalhos</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
        <Button className="justify-start" onClick={onCreateApac}>
          <PlusIcon data-icon="inline-start" />
          Nova APAC
        </Button>
        {LINKS.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            data-slot="button"
            className={buttonVariants({ variant: "outline", className: "justify-start" })}
          >
            <Icon data-icon="inline-start" />
            {label}
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
