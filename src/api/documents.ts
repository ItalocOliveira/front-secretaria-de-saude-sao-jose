import type { DocumentDestination, DocumentStatus } from "@/lib/document"
import { request } from "@/api/client"

/** Objeto devolvido por `GET /documents`, `POST /documents` e `PATCH /documents/:id` (`DocumentDomain` no backend). */
export type DocumentDto = {
  id: string
  /** Formato MMAAAA + 6 dígitos, ex: "08202600001". Gerado pelo servidor. */
  protocol_number: string
  /** Salvo em UPPERCASE pela API. */
  name: string
  note?: string
  destination: DocumentDestination
  /** Só presente quando `destination === "OUTRO"`. */
  other_destination?: string
  status: DocumentStatus
  createdAt: string
  updatedAt: string
  /**
   * Presigned URL de **download**, válida por 1h, gerada a cada `GET /documents`
   * (mesmo esquema do `pdf_url` de `ApacDto`). Não vem tipada no `DocumentDomain`
   * do backend — injetada via spread, então mantida opcional/nula aqui por segurança.
   */
  pdf_url?: string | null
}

/** Modelo que a UI consome. */
export type Document = {
  id: string
  protocolNumber: string
  name: string
  note: string | null
  destination: DocumentDestination
  otherDestination: string | null
  status: DocumentStatus
  createdAt: string
  updatedAt: string
  /** Presigned URL de download do PDF, válida por 1h. `null` se a API não mandar. */
  pdfUrl: string | null
}

export function toDocument(dto: DocumentDto): Document {
  return {
    id: dto.id,
    protocolNumber: dto.protocol_number,
    name: dto.name,
    note: dto.note ?? null,
    destination: dto.destination,
    otherDestination: dto.other_destination ?? null,
    status: dto.status,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    pdfUrl: dto.pdf_url ?? null,
  }
}

/**
 * Campos aceitos em `POST /documents`. `protocol_number` e `status` não entram:
 * são gerados/definidos pelo servidor (`status` sempre nasce como `SOLICITADO`).
 */
export type CreateDocumentPayload = {
  name: string
  note?: string
  destination: DocumentDestination
  /** Obrigatório (e só deve ser enviado) quando `destination === "OUTRO"` — a API responde 400 sem isso. */
  other_destination?: string
}

export type CreateDocumentResult = {
  document: Document
  /** Presigned PUT do Cloudflare R2, válida por 15 min. Usar com `uploadDocumentPdf`. */
  uploadUrl: string
}

export async function listDocuments(signal?: AbortSignal) {
  const data = await request<DocumentDto[]>("/documents", { signal })
  return data.map(toDocument)
}

export async function createDocument(payload: CreateDocumentPayload): Promise<CreateDocumentResult> {
  const data = await request<{ document: DocumentDto; uploadUrl: string }>("/documents", {
    method: "POST",
    body: payload,
  })
  return { document: toDocument(data.document), uploadUrl: data.uploadUrl }
}

/**
 * Campos aceitos em `PATCH /documents/:id` — todos opcionais, envie só o que muda.
 * `destination`/`other_destination` não são editáveis por aqui (ainda não existem no DTO).
 */
export type UpdateDocumentPayload = {
  name?: string
  note?: string
  status?: DocumentStatus
}

export async function updateDocument(id: string, payload: UpdateDocumentPayload): Promise<Document> {
  const data = await request<DocumentDto>(`/documents/${id}`, { method: "PATCH", body: payload })
  return toDocument(data)
}

/**
 * PUT direto pro bucket com a presigned URL devolvida por `createDocument`. O backend
 * nunca vê o arquivo, então isso **não** passa por `request()`: sem `Bearer`. `fetch`
 * usa o `Content-Type` do próprio `File` automaticamente — mesmo padrão de `uploadApacPdf`
 * e `uploadItemImage`. Se a URL expirou (>15 min), o `PUT` volta 403.
 */
export async function uploadDocumentPdf(uploadUrl: string, file: File, signal?: AbortSignal) {
  let response: Response
  try {
    response = await fetch(uploadUrl, { method: "PUT", body: file, signal })
  } catch (error) {
    if (signal?.aborted === true) {
      throw error
    }
    throw new Error("Não foi possível enviar o PDF. Verifique sua conexão e tente novamente.", { cause: error })
  }

  if (!response.ok) {
    throw new Error(
      response.status === 403
        ? "O link de envio expirou (validade de 15 minutos). O ofício já foi cadastrado; tente reenviar o PDF."
        : "Não foi possível enviar o PDF."
    )
  }
}
