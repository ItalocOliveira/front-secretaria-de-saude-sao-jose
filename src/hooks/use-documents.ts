import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  createDocument,
  listDocuments,
  updateDocument,
  uploadDocumentPdf,
  type UpdateDocumentPayload,
} from "@/api/documents"

export const DOCUMENTS_QUERY_KEY = ["documents"] as const

export function useDocuments() {
  return useQuery({
    queryKey: DOCUMENTS_QUERY_KEY,
    queryFn: ({ signal }) => listDocuments(signal),
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

/** PUT direto pro bucket — não invalida a query: `GET /documents` ainda não devolve o PDF em si. */
export function useUploadDocumentPdf() {
  return useMutation({
    mutationFn: ({ uploadUrl, file }: { uploadUrl: string; file: File }) => uploadDocumentPdf(uploadUrl, file),
  })
}
