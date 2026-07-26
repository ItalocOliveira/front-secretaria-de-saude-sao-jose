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

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

type FlowState = "done" | "current" | "todo"

type FlowStep = {
  title: string
  description: string
  icon: typeof FileTextIcon
  state: FlowState
}

const FLOW_STEPS: FlowStep[] = [
  { title: "1. Cadastro", description: "APAC cadastrada", icon: FileTextIcon, state: "done" },
  { title: "2. Documentos", description: "Anexar laudos e exames", icon: CameraIcon, state: "current" },
  { title: "3. Análise", description: "Em análise pela regulação", icon: UserSearchIcon, state: "todo" },
  { title: "4. Envio", description: "Enviada para autorização", icon: SendIcon, state: "todo" },
  { title: "5. Autorizada", description: "Procedimento autorizado", icon: CheckCircle2Icon, state: "todo" },
  { title: "6. Finalizada", description: "APAC finalizada", icon: FolderCheckIcon, state: "todo" },
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
            <TooltipContent>O fluxo avança conforme o status da APAC muda na regulação.</TooltipContent>
          </Tooltip>
        </CardTitle>
        <CardDescription>Etapas percorridas por uma autorização até a finalização.</CardDescription>
      </CardHeader>

      <CardContent className="overflow-x-auto">
        <ol className="flex min-w-max items-stretch gap-1">
          {FLOW_STEPS.map((step, index) => (
            <li key={step.title} className="flex items-center gap-1">
              <Item
                variant={step.state === "todo" ? "default" : "muted"}
                size="sm"
                className={cn("w-48 items-start", step.state === "current" && "ring-1 ring-primary")}
              >
                <ItemMedia>
                  <div
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full",
                      step.state === "done" && "bg-primary text-primary-foreground",
                      step.state === "current" && "bg-primary/10 text-primary",
                      step.state === "todo" && "bg-muted text-muted-foreground"
                    )}
                  >
                    <step.icon className="size-4" />
                  </div>
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{step.title}</ItemTitle>
                  <ItemDescription>{step.description}</ItemDescription>
                  {step.state === "current" ? <Badge variant="secondary">Etapa atual</Badge> : null}
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
