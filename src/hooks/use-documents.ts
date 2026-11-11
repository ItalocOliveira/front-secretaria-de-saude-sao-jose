import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  createDocument,
  deleteDocument,
  listDocuments,
  updateDocument,
  uploadDocumentPdf,
  type UpdateDocumentPayload,
} from "@/api/documents"
import { ApiError } from "@/api/client"

export const DOCUMENTS_QUERY_KEY = ["documents"] as const

/** `enabled: false` para perfis sem `GET /documents` (`RECEPCIONISTA` só cria) — a API devolveria 403. */
export function useDocuments({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: DOCUMENTS_QUERY_KEY,
    queryFn: ({ signal }) => listDocuments(signal),
    enabled,
  })
}

export function useCreateDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createDocument,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY }),
  })
}

export function useUpdateDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDocumentPayload }) => updateDocument(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY }),
  })
}

/**
 * Invalida a lista também no `404`: o documento já não existe (excluído em outra aba,
 * por exemplo), então ele tem que sumir da tabela do mesmo jeito.
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onSettled: (_data, error) =>
      error === null || (error instanceof ApiError && error.status === 404)
        ? queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY })
        : undefined,
  })
}

/** PUT direto pro bucket — não invalida a query: `GET /documents` ainda não devolve o PDF em si. */
export function useUploadDocumentPdf() {
  return useMutation({
    mutationFn: ({ uploadUrl, file }: { uploadUrl: string; file: File }) => uploadDocumentPdf(uploadUrl, file),
  })
}
