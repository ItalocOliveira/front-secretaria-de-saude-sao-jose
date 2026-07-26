import {
  CheckIcon,
  FileTextIcon,
  FlaskConicalIcon,
  InfoIcon,
  PaperclipIcon,
  ScanLineIcon,
  StampIcon,
} from "lucide-react"

import type { ApacDocumentKey, ApacFormValues } from "@/lib/apac-form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"

type DocumentType = {
  key: ApacDocumentKey
  label: string
  description: string
  icon: typeof FileTextIcon
  action: "scan" | "attach"
  required: boolean
}

const DOCUMENT_TYPES: DocumentType[] = [
  {
    key: "laudo",
    label: "Laudo",
    description: "Escaneie ou anexe o laudo médico",
    icon: FileTextIcon,
    action: "scan",
    required: true,
  },
  {
    key: "exames",
    label: "Exames",
    description: "Escaneie ou anexe os exames",
    icon: FlaskConicalIcon,
    action: "scan",
    required: true,
  },
  {
    key: "solicitacao",
    label: "Solicitação médica",
    description: "Escaneie ou anexe a solicitação",
    icon: StampIcon,
    action: "scan",
    required: true,
  },
  {
    key: "outros",
    label: "Outros documentos",
    description: "Anexe documentos complementares",
    icon: PaperclipIcon,
    action: "attach",
    required: false,
  },
]

export function ApacFormDocumentsStep({
  values,
  errors,
  onChange,
}: {
  values: ApacFormValues
  errors: Set<string>
  onChange: (partial: Partial<ApacFormValues>) => void
}) {
  const toggleDocument = (key: ApacDocumentKey) => {
    onChange({ documents: { ...values.documents, [key]: !values.documents[key] } })
  }

  return (
    <div className="flex flex-col gap-4">
      <ItemGroup className="gap-2">
        {DOCUMENT_TYPES.map((document) => {
          const attached = values.documents[document.key]
          const invalid = errors.has(`doc:${document.key}`)

          return (
            <Item key={document.key} variant="outline" aria-invalid={invalid || undefined}>
              <ItemMedia variant="icon">
                <document.icon />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>
                  {document.label}
                  {document.required ? null : <Badge variant="outline">Opcional</Badge>}
                  {attached ? (
                    <Badge variant="secondary">
                      <CheckIcon />
                      Anexado
                    </Badge>
                  ) : null}
                </ItemTitle>
                <ItemDescription>{document.description}</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button
                  variant={attached ? "ghost" : "outline"}
                  size="sm"
                  onClick={() => toggleDocument(document.key)}
                  aria-invalid={invalid || undefined}
                >
                  {document.action === "scan" ? (
                    <ScanLineIcon data-icon="inline-start" />
                  ) : (
                    <PaperclipIcon data-icon="inline-start" />
                  )}
                  {attached ? "Remover" : document.action === "scan" ? "Escanear" : "Anexar"}
                </Button>
              </ItemActions>
            </Item>
          )
        })}
      </ItemGroup>

      <Alert>
        <InfoIcon />
        <AlertTitle>Formatos aceitos</AlertTitle>
        <AlertDescription>
          PDF, JPG ou PNG, com no máximo 10 MB por arquivo. O upload real depende do endpoint de anexos, ainda não
          disponível na API.
        </AlertDescription>
      </Alert>
    </div>
  )
}
