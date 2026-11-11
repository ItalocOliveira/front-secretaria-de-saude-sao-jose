import type { PaginationInfo } from "@/api/pagination"
import { cn } from "@/lib/utils"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

type PageItem = number | "ellipsis-start" | "ellipsis-end"

/** Primeira, última e vizinhas da atual; o resto vira reticências. */
function getPageItems(current: number, total: number): PageItem[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  const middle = Array.from({ length: end - start + 1 }, (_, index) => start + index)

  return [
    1,
    ...(start > 2 ? (["ellipsis-start"] as const) : []),
    ...middle,
    ...(end < total - 1 ? (["ellipsis-end"] as const) : []),
    total,
  ]
}

/**
 * Rodapé de tabela paginada pela API (`{ data, pagination }`). Mostra o intervalo exibido
 * e, se houver mais de uma página, os links de navegação.
 */
export function ListPagination({
  pagination,
  label,
  onPageChange,
}: {
  pagination: PaginationInfo
  /** Nome do que está sendo paginado, para o `aria-label` ("APACs", "ofícios"...). */
  label: string
  onPageChange: (page: number) => void
}) {
  const { page, pageSize, total, totalPages } = pagination
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, total)

  // Links sem navegação real: a página vive no estado, não na URL.
  const go = (target: number) => (event: React.MouseEvent) => {
    event.preventDefault()
    if (target >= 1 && target <= totalPages && target !== page) {
      onPageChange(target)
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3">
      <span className="text-sm text-muted-foreground tabular-nums">
        Mostrando {first}–{last} de {total}
      </span>

      {totalPages > 1 ? (
        <Pagination aria-label={`Paginação de ${label}`} className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                text="Anterior"
                aria-label="Página anterior"
                aria-disabled={page <= 1}
                className={cn(page <= 1 && "pointer-events-none opacity-50")}
                onClick={go(page - 1)}
              />
            </PaginationItem>
            {getPageItems(page, totalPages).map((item) =>
              typeof item === "number" ? (
                <PaginationItem key={item}>
                  <PaginationLink
                    href="#"
                    isActive={item === page}
                    aria-label={`Página ${item}`}
                    className="tabular-nums"
                    onClick={go(item)}
                  >
                    {item}
                  </PaginationLink>
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <PaginationEllipsis />
                </PaginationItem>
              )
            )}
            <PaginationItem>
              <PaginationNext
                href="#"
                text="Próxima"
                aria-label="Próxima página"
                aria-disabled={page >= totalPages}
                className={cn(page >= totalPages && "pointer-events-none opacity-50")}
                onClick={go(page + 1)}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  )
}
