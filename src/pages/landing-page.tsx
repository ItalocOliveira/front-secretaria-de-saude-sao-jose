import { ArrowRightIcon, BuildingIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"

/**
 * Link de transição para quem tinha o `www` salvo nos favoritos
 * (`.docs/att-backend/2026-11-12-landing-sem-municipio.md`).
 * Quando houver mais prefeituras, troque por `null` — o bloco some sozinho.
 */
const TRANSITION_TENANT: { name: string; host: string } | null = {
  name: "São José dos Ramos",
  host: "saojosedosramos.pb.icosaude.com.br",
}

const CURRENT_YEAR = new Date().getFullYear()

/**
 * Página do domínio principal (`icosaude.com.br`, `www`, `localhost` sem município).
 * Neutra: nada de município, nenhuma chamada à API — o `TenantGate` só a monta sem `TENANT_SLUG`.
 */
export function LandingPage() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <img src="/logo_icos.png" alt="" className="size-20 object-contain" />
            <div className="flex flex-col gap-2">
              <h1 className="text-4xl font-extrabold tracking-tight">ICOS</h1>
              <p className="text-muted-foreground">Sistema de gestão para secretarias municipais de saúde.</p>
            </div>
          </div>

          <Alert className="text-left">
            <BuildingIcon />
            <AlertTitle>Já é cliente?</AlertTitle>
            <AlertDescription>
              Acesse pelo endereço da sua prefeitura:{" "}
              <code className="font-mono text-foreground">&lt;municipio&gt;.&lt;uf&gt;.icosaude.com.br</code>
            </AlertDescription>
          </Alert>

          {TRANSITION_TENANT === null ? null : (
            <p className="text-sm text-muted-foreground">
              Servidor de {TRANSITION_TENANT.name}?{" "}
              <a
                href={`https://${TRANSITION_TENANT.host}`}
                className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
              >
                Acesse {TRANSITION_TENANT.host}
                <ArrowRightIcon className="size-3.5" />
              </a>
            </p>
          )}
        </div>
      </main>

      <Separator />
      <footer className="p-4 text-center text-xs text-muted-foreground">© {CURRENT_YEAR} ICOS</footer>
    </div>
  )
}
