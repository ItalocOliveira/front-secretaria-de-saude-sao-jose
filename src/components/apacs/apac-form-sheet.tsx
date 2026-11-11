import { useState } from "react"
import { CheckIcon } from "lucide-react"

import { getStepErrors, INITIAL_APAC_FORM, toCreateApacPayload, type ApacFormValues } from "@/lib/apac-form"
import { cn } from "@/lib/utils"
import { useCreateApac, useUploadApacPdf } from "@/hooks/use-apacs"
import { ApacFormPatientStep } from "@/components/apacs/apac-form-patient-step"
import { ApacFormRequestStep } from "@/components/apacs/apac-form-request-step"
import { ApacFormReviewStep } from "@/components/apacs/apac-form-review-step"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"

const STEPS = [
  { value: 1, label: "Paciente" },
  { value: 2, label: "Solicitação" },
  { value: 3, label: "Revisão" },
]

const LAST_STEP = STEPS.length
const NO_ERRORS: Set<string> = new Set()

/**
 * APAC já criada, mas o `PUT` pro R2 falhou (link expirado, rede caiu no meio do
 * envio...). Guarda só o necessário pra reenviar sem recriar o registro — não há
 * endpoint pra regerar a `uploadUrl` isoladamente.
 */
type PendingUpload = { uploadUrl: string; file: File; apacName: string }

/**
 * Indicador único de etapas (concluída / atual / pendente). Não é clicável: o
 * cadastro é em sequência, e voltar a uma etapa é pelo "Editar" da revisão.
 */
function Stepper({ step }: { step: number }) {
  return (
    <ol className="mt-4 flex items-center" aria-label="Etapas do cadastro">
      {STEPS.map((item) => {
        const state = item.value < step ? "done" : item.value === step ? "current" : "todo"

        return (
          <li
            key={item.value}
            aria-current={state === "current" ? "step" : undefined}
            className={cn(
              "flex items-center gap-2 text-sm font-medium text-muted-foreground",
              "not-first:before:mx-2.5 not-first:before:h-0.5 not-first:before:w-6 not-first:before:rounded-full not-first:before:bg-border not-first:before:content-[''] sm:not-first:before:w-9",
              state !== "todo" && "text-foreground",
              state === "current" && "font-semibold",
              state !== "todo" && "not-first:before:bg-primary"
            )}
          >
            <span
              className={cn(
                "flex size-6.5 shrink-0 items-center justify-center rounded-full border-2 text-[0.8125rem] font-bold tabular-nums",
                state === "todo" && "border-border",
                state === "current" && "border-primary bg-primary text-primary-foreground",
                state === "done" && "border-primary text-foreground"
              )}
            >
              {state === "done" ? <CheckIcon className="size-3.5" aria-hidden /> : item.value}
            </span>
            {/* No celular só a etapa atual mostra o nome. */}
            <span className={cn(state !== "current" && "hidden sm:inline")}>{item.label}</span>
          </li>
        )
      })}
    </ol>
  )
}

export function ApacFormSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [step, setStep] = useState(1)
  const [values, setValues] = useState<ApacFormValues>(INITIAL_APAC_FORM)
  const [validating, setValidating] = useState(false)
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null)
  const { mutate: createApac, isPending: creating, error: createError, reset: resetCreateMutation } = useCreateApac()
  const { mutate: uploadPdf, isPending: uploading, error: uploadError, reset: resetUploadMutation } = useUploadApacPdf()

  const isPending = creating || uploading

  // Derivado no render: nada de `useEffect` para calcular erro de validação.
  const errors = validating ? getStepErrors(step, values) : NO_ERRORS

  const patch = (partial: Partial<ApacFormValues>) => {
    setValues((current) => ({ ...current, ...partial }))
  }

  const reset = () => {
    setValues(INITIAL_APAC_FORM)
    setStep(1)
    setValidating(false)
    setPendingUpload(null)
    resetCreateMutation()
    resetUploadMutation()
  }

  const finish = () => {
    reset()
    onOpenChange(false)
  }

  const goToStep = (target: number) => {
    if (target <= step) {
      setStep(target)
      setValidating(false)
      return
    }

    if (getStepErrors(step, values).size > 0) {
      setValidating(true)
      toast.add({
        title: "Campos obrigatórios",
        description: "Preencha os campos destacados para continuar.",
      })
      return
    }

    setStep(target)
    setValidating(false)
  }

  const submit = () => {
    createApac(toCreateApacPayload(values), {
      onSuccess: ({ apac, uploadUrl }) => {
        if (values.pdfFile === null) {
          toast.add({
            title: "APAC cadastrada",
            description: `A APAC de ${apac.name} entrou na fila da regulação como pendente.`,
          })
          finish()
          return
        }

        uploadPdf(
          { uploadUrl, file: values.pdfFile },
          {
            onSuccess: () => {
              toast.add({
                title: "APAC cadastrada",
                description: `A APAC de ${apac.name} entrou na fila da regulação como pendente. PDF enviado.`,
              })
              finish()
            },
            // APAC já existe — não recriar. Guarda o arquivo pra permitir só o reenvio do PUT.
            onError: () => setPendingUpload({ uploadUrl, file: values.pdfFile as File, apacName: apac.name }),
          }
        )
      },
    })
  }

  const retryUpload = () => {
    if (pendingUpload === null) return

    uploadPdf(
      { uploadUrl: pendingUpload.uploadUrl, file: pendingUpload.file },
      {
        onSuccess: () => {
          toast.add({
            title: "PDF enviado",
            description: `Documento da APAC de ${pendingUpload.apacName} enviado com sucesso.`,
          })
          finish()
        },
      }
    )
  }

  const dismissPendingUpload = () => {
    toast.add({
      title: "APAC cadastrada sem o PDF",
      description: "Você pode anexar o documento depois, quando o reenvio estiver disponível.",
    })
    finish()
  }

  // Com a APAC já criada e o PDF pendente, fechar o painel equivale a seguir sem o PDF.
  const handleOpenChange = (next: boolean) => {
    if (!next && isPending) return
    if (!next && pendingUpload !== null) {
      dismissPendingUpload()
      return
    }
    onOpenChange(next)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full gap-0 p-0 data-[side=right]:sm:max-w-155">
        <SheetHeader className="border-b px-6 pt-5.5 pb-4.5">
          <SheetTitle className="text-xl font-bold tracking-tight">Nova APAC</SheetTitle>
          <SheetDescription>
            {pendingUpload === null
              ? "Os dados são salvos apenas ao confirmar na revisão."
              : "APAC cadastrada — envio do PDF pendente."}
          </SheetDescription>
          {pendingUpload === null ? <Stepper step={step} /> : null}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {pendingUpload === null ? (
            <div className="flex flex-col gap-6">
              {createError === null ? null : (
                <Alert variant="destructive">
                  <AlertTitle>Não foi possível cadastrar a APAC</AlertTitle>
                  {/* Só a mensagem, nunca o corpo cru do erro (`ApiError.details`). */}
                  <AlertDescription>{createError.message}</AlertDescription>
                </Alert>
              )}

              {step === 1 ? <ApacFormPatientStep values={values} errors={errors} onChange={patch} /> : null}
              {step === 2 ? <ApacFormRequestStep values={values} errors={errors} onChange={patch} /> : null}
              {step === 3 ? (
                <ApacFormReviewStep values={values} disabled={isPending} onChange={patch} onEditStep={goToStep} />
              ) : null}
            </div>
          ) : (
            <Alert variant="destructive">
              <AlertTitle>O envio do PDF falhou</AlertTitle>
              <AlertDescription>
                A APAC de {pendingUpload.apacName} já foi cadastrada e está na fila da regulação — só o documento não
                foi salvo. {uploadError?.message ?? "Tente reenviar o arquivo."}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Ações sempre visíveis, sem precisar rolar até o fim do formulário. */}
        <SheetFooter className="mt-0 flex-row items-center gap-2 border-t px-6 py-3.5">
          {pendingUpload === null ? (
            <>
              <span className="mr-auto text-[0.8125rem] text-muted-foreground">
                <span className="text-destructive">*</span> Obrigatório
              </span>

              {step > 1 ? (
                <Button variant="ghost" onClick={() => goToStep(step - 1)} disabled={isPending}>
                  Voltar
                </Button>
              ) : (
                <Button variant="ghost" onClick={finish} disabled={isPending}>
                  Cancelar
                </Button>
              )}

              {step < LAST_STEP ? (
                <Button onClick={() => goToStep(step + 1)}>Continuar</Button>
              ) : (
                <Button onClick={submit} disabled={isPending}>
                  {isPending ? <Spinner data-icon="inline-start" /> : <CheckIcon data-icon="inline-start" />}
                  Cadastrar APAC
                </Button>
              )}
            </>
          ) : (
            <>
              <Button variant="ghost" className="ml-auto" onClick={dismissPendingUpload} disabled={uploading}>
                Continuar sem PDF
              </Button>
              <Button onClick={retryUpload} disabled={uploading}>
                {uploading ? <Spinner data-icon="inline-start" /> : <CheckIcon data-icon="inline-start" />}
                Tentar reenviar
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
