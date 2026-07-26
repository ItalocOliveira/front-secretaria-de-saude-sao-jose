import { useState, useTransition } from "react"
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, XIcon } from "lucide-react"

import { getStepErrors, INITIAL_APAC_FORM, type ApacFormValues } from "@/lib/apac-form"
import { ApacFormDocumentsStep } from "@/components/apacs/apac-form-documents-step"
import { ApacFormPatientStep } from "@/components/apacs/apac-form-patient-step"
import { ApacFormRequestStep } from "@/components/apacs/apac-form-request-step"
import { ApacFormReviewStep } from "@/components/apacs/apac-form-review-step"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

const STEPS = [
  { value: 1, label: "Paciente" },
  { value: 2, label: "Solicitação" },
  { value: 3, label: "Documentos" },
  { value: 4, label: "Revisão" },
]

const LAST_STEP = STEPS.length
const NO_ERRORS: Set<string> = new Set()

export function ApacFormCard({ ref }: { ref?: React.Ref<HTMLDivElement> }) {
  const [step, setStep] = useState(1)
  const [values, setValues] = useState<ApacFormValues>(INITIAL_APAC_FORM)
  const [validating, setValidating] = useState(false)
  const [isSubmitting, startSubmit] = useTransition()

  // Derivado no render: nada de `useEffect` para calcular erro de validação.
  const errors = validating ? getStepErrors(step, values) : NO_ERRORS

  const patch = (partial: Partial<ApacFormValues>) => {
    setValues((current) => ({ ...current, ...partial }))
  }

  const reset = () => {
    setValues(INITIAL_APAC_FORM)
    setStep(1)
    setValidating(false)
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
    startSubmit(async () => {
      // Simula a chamada `POST /apecs` enquanto a camada de API não existe.
      await new Promise((resolve) => setTimeout(resolve, 800))

      toast.add({
        title: "APAC cadastrada",
        description: `A APAC de ${values.name} entrou na fila da regulação como pendente.`,
      })
      reset()
    })
  }

  return (
    <Card ref={ref}>
      <CardHeader>
        <CardTitle>Cadastro de nova APAC</CardTitle>
        <CardDescription>
          Etapa {step} de {LAST_STEP} — {STEPS[step - 1].label}
        </CardDescription>
      </CardHeader>

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
            <ToggleGroupItem key={item.value} value={String(item.value)} className="flex-1">
              <span className="flex size-4 items-center justify-center rounded-full bg-muted text-xs tabular-nums">
                {item.value}
              </span>
              <span className="hidden sm:inline">{item.label}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <Progress value={(step / LAST_STEP) * 100} aria-label="Progresso do cadastro" />

        {step === 1 ? <ApacFormPatientStep values={values} errors={errors} onChange={patch} /> : null}
        {step === 2 ? <ApacFormRequestStep values={values} errors={errors} onChange={patch} /> : null}
        {step === 3 ? <ApacFormDocumentsStep values={values} errors={errors} onChange={patch} /> : null}
        {step === 4 ? <ApacFormReviewStep values={values} /> : null}
      </CardContent>

      <CardFooter className="justify-end gap-2">
        <Button variant="ghost" onClick={reset} disabled={isSubmitting}>
          <XIcon data-icon="inline-start" />
          Cancelar
        </Button>

        {step > 1 ? (
          <Button variant="outline" onClick={() => goToStep(step - 1)} disabled={isSubmitting}>
            <ArrowLeftIcon data-icon="inline-start" />
            Voltar
          </Button>
        ) : null}

        {step < LAST_STEP ? (
          <Button onClick={() => goToStep(step + 1)}>
            Salvar e continuar
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        ) : (
          <Button onClick={submit} disabled={isSubmitting}>
            {isSubmitting ? <Spinner data-icon="inline-start" /> : <CheckIcon data-icon="inline-start" />}
            Concluir cadastro
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
