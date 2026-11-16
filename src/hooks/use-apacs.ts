import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"

import {
  createApac,
  deleteApac,
  listApacs,
  attachApacPdf,
  requestApacPdfDownloadUrl,
  updateApac,
  type ApacListParams,
  type UpdateApacPayload,
} from "@/api/apacs"
import { ApiError } from "@/api/client"
import { toast } from "@/components/ui/toast"
import { NOTIFICATIONS_QUERY_KEY } from "@/hooks/use-notifications"

/** Prefixo de todas as páginas/filtros — invalidar por ele atualiza qualquer listagem aberta. */
export const APACS_QUERY_KEY = ["apacs"] as const

/** Status/prioridade de APAC alimentam o sino (`urgentApacs`) — criar, editar e excluir atualizam os dois. */
function invalidateApacs(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: APACS_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
  ])
}

export function useApacs(params: ApacListParams) {
  return useQuery({
    queryKey: [...APACS_QUERY_KEY, params],
    queryFn: ({ signal }) => listApacs(params, signal),
    // Trocar de página/busca mantém a página anterior na tela até a nova chegar.
    placeholderData: keepPreviousData,
  })
}

export function useCreateApac() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createApac,
    onSuccess: () => invalidateApacs(queryClient),
  })
}

export function useUpdateApac() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateApacPayload }) => updateApac(id, payload),
    onSuccess: () => invalidateApacs(queryClient),
  })
}

/** Invalida também no `404`: a APAC já não existe, então tem que sumir da tabela do mesmo jeito. */
export function useDeleteApac() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteApac(id),
    onSettled: (_data, error) =>
      error === null || (error instanceof ApiError && error.status === 404) ? invalidateApacs(queryClient) : undefined,
  })
}

/**
 * Anexa/substitui o PDF de uma APAC (`upload-url` → `PUT` no R2 → `confirm`). Passe `uploadUrl`
 * para reaproveitar a URL devolvida pelo `POST /apacs`; sem ela, gera uma nova. Invalida a
 * listagem porque `has_pdf` muda.
 */
export function useAttachApacPdf() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, file, uploadUrl }: { id: string; file: File; uploadUrl?: string }) =>
      attachApacPdf(id, file, uploadUrl),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: APACS_QUERY_KEY }),
  })
}

/** Conteúdo provisório da aba enquanto o link chega (`about:blank` é da mesma origem). */
function showLoading(tab: Window) {
  try {
    tab.document.title = "Abrindo PDF…"
    tab.document.body.textContent = "Abrindo PDF…"
  } catch {
    // Só cosmético: se o navegador não deixar escrever, a aba fica em branco até o redirecionamento.
  }
}

/**
 * "Ver PDF" de APAC: pede o link no clique (`POST /apacs/:id/pdf/download-url`, 5 min) — cada
 * abertura fica no registro de atividade do município. A aba é aberta **no próprio clique** (senão
 * o navegador bloqueia o pop-up depois do `await`) e recebe o link quando ele chega. `404`/`409`
 * (APAC excluída ou sem PDF) recarregam a listagem, porque a tela está desatualizada.
 *
 * `pendingId`: APAC cujo link está sendo pedido — para o botão mostrar `Spinner`.
 */
export function useOpenApacPdf() {
  const queryClient = useQueryClient()
  const mutation = useMutation({ mutationFn: (id: string) => requestApacPdfDownloadUrl(id) })

  const open = (id: string) => {
    const tab = window.open("", "_blank")
    if (tab !== null) {
      // Equivale ao `noopener`: a aba do PDF não alcança esta página.
      tab.opener = null
      showLoading(tab)
    }

    mutation.mutate(id, {
      onSuccess: (downloadUrl) => {
        if (tab !== null) {
          tab.location.href = downloadUrl
          return
        }
        if (window.open(downloadUrl, "_blank", "noopener,noreferrer") === null) {
          toast.add({
            title: "O navegador bloqueou a nova aba",
            description: "Permita pop-ups para este site e tente de novo.",
          })
        }
      },
      onError: (error) => {
        tab?.close()
        if (error instanceof ApiError && (error.status === 404 || error.status === 409)) {
          void queryClient.invalidateQueries({ queryKey: APACS_QUERY_KEY })
        }
        toast.add({ title: "Não foi possível abrir o PDF", description: error.message })
      },
    })
  }

  return { open, pendingId: mutation.isPending ? mutation.variables : undefined }
}
