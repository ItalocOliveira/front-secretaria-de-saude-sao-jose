import { useState } from "react"
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, XIcon } from "lucide-react"

import { getStepErrors, INITIAL_APAC_FORM, toCreateApacPayload, type ApacFormValues } from "@/lib/apac-form"
import { useCreateApac, useUploadApacPdf } from "@/hooks/use-apacs"
import { ApacFormPatientStep } from "@/components/apacs/apac-form-patient-step"
import { ApacFormRequestStep } from "@/components/apacs/apac-form-request-step"
import { ApacFormReviewStep } from "@/components/apacs/apac-form-review-step"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

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

export function ApacFormCard({ ref }: { ref?: React.Ref<HTMLDivElement> }) {
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
          reset()
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
              reset()
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
          reset()
        },
      }
    )
  }

  const dismissPendingUpload = () => {
    toast.add({
      title: "APAC cadastrada sem o PDF",
      description: "Você pode anexar o documento depois, quando o reenvio estiver disponível.",
    })
    reset()
  }

  return (
    <Card ref={ref}>
      <CardHeader>
        <CardTitle>Cadastro de nova APAC</CardTitle>
        <CardDescription>
          {pendingUpload === null
            ? `Etapa ${step} de ${LAST_STEP} — ${STEPS[step - 1].label}`
            : "APAC cadastrada — envio do PDF pendente"}
        </CardDescription>
      </CardHeader>

      {pendingUpload === null ? (
        <>
          <CardContent className="flex flex-col gap-4">
            <ToggleGroup
              className="w-full"
              variant="outline"
              spacing={0}
              value={[String(step)]}
              onValueChange={(next: string[]) => {
                const target = Number(next.at(0))
                if (target) {
                  goToStep(target)
                }
              }}
            >
              {STEPS.map((item) => (
                <ToggleGroupItem key={item.value} value={String(item.value)} className="flex-1" disabled={isPending}>
                  <span className="flex size-4 items-center justify-center rounded-full bg-muted text-xs tabular-nums">
                    {item.value}
                  </span>
                  <span className="hidden sm:inline">{item.label}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            <Progress value={(step / LAST_STEP) * 100} aria-label="Progresso do cadastro" />

            {createError === null ? null : (
              <Alert variant="destructive">
                <AlertTitle>Não foi possível cadastrar a APAC</AlertTitle>
                {/* Só a mensagem: o `details` do 500 pode trazer os dados do paciente. */}
                <AlertDescription>{createError.message}</AlertDescription>
              </Alert>
            )}

            {step === 1 ? <ApacFormPatientStep values={values} errors={errors} onChange={patch} /> : null}
            {step === 2 ? <ApacFormRequestStep values={values} errors={errors} onChange={patch} /> : null}
            {step === 3 ? <ApacFormReviewStep values={values} disabled={isPending} onChange={patch} /> : null}
          </CardContent>

          <CardFooter className="justify-end gap-2">
            <Button variant="ghost" onClick={reset} disabled={isPending}>
              <XIcon data-icon="inline-start" />
              Cancelar
            </Button>

            {step > 1 ? (
              <Button variant="outline" onClick={() => goToStep(step - 1)} disabled={isPending}>
                <ArrowLeftIcon data-icon="inline-start" />
                Voltar
              </Button>
            ) : null}

            {step < LAST_STEP ? (
              <Button onClick={() => goToStep(step + 1)}>
                Continuar
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
            ) : (
              <Button onClick={submit} disabled={isPending}>
                {isPending ? <Spinner data-icon="inline-start" /> : <CheckIcon data-icon="inline-start" />}
                Concluir cadastro
              </Button>
            )}
          </CardFooter>
        </>
      ) : (
        <>
          <CardContent>
            <Alert variant="destructive">
              <AlertTitle>O envio do PDF falhou</AlertTitle>
              <AlertDescription>
                A APAC de {pendingUpload.apacName} já foi cadastrada e está na fila da regulação — só o documento não
                foi salvo. {uploadError?.message ?? "Tente reenviar o arquivo."}
              </AlertDescription>
            </Alert>
          </CardContent>

          <CardFooter className="justify-end gap-2">
            <Button variant="ghost" onClick={dismissPendingUpload} disabled={uploading}>
              <XIcon data-icon="inline-start" />
              Continuar sem PDF
            </Button>
            <Button onClick={retryUpload} disabled={uploading}>
              {uploading ? <Spinner data-icon="inline-start" /> : <CheckIcon data-icon="inline-start" />}
              Tentar reenviar
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  )
}
