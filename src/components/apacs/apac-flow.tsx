import {
  CameraIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  FileTextIcon,
  FolderCheckIcon,
  InfoIcon,
  SendIcon,
  UserSearchIcon,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

type FlowStep = {
  title: string
  description: string
  icon: typeof FileTextIcon
}

/** Fluxo de referência: só lembra as etapas, não reflete o andamento de nenhuma APAC. */
const FLOW_STEPS: FlowStep[] = [
  { title: "1. Cadastro", description: "APAC cadastrada", icon: FileTextIcon },
  { title: "2. Documentos", description: "Anexar laudos e exames", icon: CameraIcon },
  { title: "3. Análise", description: "Em análise pela regulação", icon: UserSearchIcon },
  { title: "4. Envio", description: "Enviada para autorização", icon: SendIcon },
  { title: "5. Autorizada", description: "Procedimento autorizado", icon: CheckCircle2Icon },
  { title: "6. Finalizada", description: "APAC finalizada", icon: FolderCheckIcon },
]

export function ApacFlow() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          Fluxo da APAC
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="text-muted-foreground" tabIndex={0} aria-label="Sobre o fluxo">
                  <InfoIcon className="size-4" />
                </span>
              }
            />
            <TooltipContent>
              Guia de referência das etapas. O andamento de cada APAC aparece no status dela.
            </TooltipContent>
          </Tooltip>
        </CardTitle>
        <CardDescription>Etapas percorridas por uma autorização até a finalização.</CardDescription>
      </CardHeader>

      <CardContent className="overflow-x-auto">
        <ol className="flex min-w-max items-stretch gap-1">
          {FLOW_STEPS.map((step, index) => (
            <li key={step.title} className="flex items-center gap-1">
              <Item variant="muted" size="sm" className="w-48 items-start">
                <ItemMedia>
                  <div className="flex size-8 items-center justify-center rounded-full bg-background text-muted-foreground">
                    <step.icon className="size-4" />
                  </div>
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{step.title}</ItemTitle>
                  <ItemDescription>{step.description}</ItemDescription>
                </ItemContent>
              </Item>
              {index < FLOW_STEPS.length - 1 ? (
                <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              ) : null}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}
