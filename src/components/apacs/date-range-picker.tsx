import { lazy, Suspense } from "react"
import type { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"

// `react-day-picker` é pesado e só é necessário quando o popover abre.
const Calendar = lazy(() => import("@/components/ui/calendar").then((module) => ({ default: module.Calendar })))

function formatRange(range: DateRange | undefined) {
  if (!range?.from) {
    return "Selecione o período"
  }

  const from = format(range.from, "dd/MM/yyyy", { locale: ptBR })

  if (!range.to) {
    return `A partir de ${from}`
  }

  return `${from} até ${format(range.to, "dd/MM/yyyy", { locale: ptBR })}`
}

export function DateRangePicker({
  id,
  value,
  onValueChange,
}: {
  id?: string
  value: DateRange | undefined
  onValueChange: (range: DateRange | undefined) => void
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button id={id} variant="outline" className="w-full justify-between font-normal">
            <span className="truncate">{formatRange(value)}</span>
            <CalendarIcon data-icon="inline-end" />
          </Button>
        }
      />
      <PopoverContent align="start" className="w-auto p-0">
        <Suspense fallback={<Skeleton className="h-72 w-64" />}>
          <Calendar mode="range" locale={ptBR} numberOfMonths={1} selected={value} onSelect={onValueChange} autoFocus />
        </Suspense>
      </PopoverContent>
    </Popover>
  )
}
