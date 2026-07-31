import type { ApacAcs, ApacPriority, ApacProcedure, ApacStatus } from "@/lib/apac"
import { request } from "@/api/client"

/**
 * Objeto devolvido por `GET /apacs` e `POST /apacs`.
 *
 * `id` e `created_at` estão no schema Prisma mas **não aparecem** no exemplo de
 * resposta da doc — por isso são opcionais aqui. Confirmar com o backend: sem
 * `id` não há como abrir detalhe nem editar uma APAC.
 */
export type ApacDto = {
  id?: string
  name: string
  /** Criptografado pela API. Não é legível e não deve ser exibido. */
  cns: string
  /** Criptografado pela API, quando informado. */
  cpf?: string | null
  procedure: ApacProcedure
  priority: ApacPriority
  status: ApacStatus
  birth_date?: string | null
  municipality?: string | null
  created_at?: string
  updated_at?: string
  /**
   * Presigned URL de **download**, válida por 1h, gerada a cada `GET /apacs`.
   * Não vem tipada no `ApacDomain` do backend (injetada via spread) — presente
   * mesmo quando nenhum PDF foi enviado ainda, então não use como indicador de
   * "tem PDF".
   */
  pdf_url?: string | null
}

/**
 * Modelo que a UI consome.
 *
 * `cns` e `cpf` ficam de fora de propósito: chegam criptografados (inúteis na
 * tela) e são dado pessoal de saúde. Deixá-los fora do view model garante que
 * nenhum componente os renderize por descuido.
 */
export type Apac = {
  id: string
  name: string
  procedure: ApacProcedure
  priority: ApacPriority
  status: ApacStatus
  municipality: string | null
  birthDate: string | null
  createdAt: string | null
  /** Presigned URL de download do PDF, válida por 1h. `null` se a API não mandar. */
  pdfUrl: string | null
}

export function toApac(dto: ApacDto, index: number): Apac {
  return {
    // Fallback pelo índice só para servir de `key` enquanto o `id` não vier na
    // resposta. Não use para navegação — não é estável entre refetches.
    id: dto.id ?? `sem-id-${index}`,
    name: dto.name,
    procedure: dto.procedure,
    priority: dto.priority,
    status: dto.status,
    municipality: dto.municipality ?? null,
    birthDate: dto.birth_date ?? null,
    createdAt: dto.created_at ?? null,
    pdfUrl: dto.pdf_url ?? null,
  }
}

/** Campos aceitos em `POST /apacs`. `status` não entra: a API cria como `PENDENTE`. */
export type CreateApacPayload = {
  name: string
  cns: string
  procedure: ApacProcedure
  priority: ApacPriority
  /** ACS (Agente Comunitário de Saúde) responsável — obrigatório pela API. */
  acs: ApacAcs
  birth_date?: string
  cpf?: string
  municipality?: string
}

export type CreateApacResult = {
  apac: Apac
  /** Presigned PUT do Cloudflare R2, válida por 15 min. Usar com `uploadApacPdf`. */
  uploadUrl: string
}

export async function listApacs(signal?: AbortSignal) {
  const data = await request<ApacDto[]>("/apacs", { signal })
  return data.map(toApac)
}

export async function createApac(payload: CreateApacPayload): Promise<CreateApacResult> {
  const data = await request<{ apac: ApacDto; uploadUrl: string }>("/apacs", { method: "POST", body: payload })
  return { apac: toApac(data.apac, 0), uploadUrl: data.uploadUrl }
}

/**
 * PUT direto pro bucket com a presigned URL devolvida por `createApac`. O backend
 * nunca vê o arquivo, então isso **não** passa por `request()`: sem `Bearer`, sem
 * `Content-Type: application/json`. Se a URL expirou (>15 min), o `PUT` volta 403.
 */
export async function uploadApacPdf(uploadUrl: string, file: File, signal?: AbortSignal) {
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
        ? "O link de envio expirou (validade de 15 minutos). A APAC já foi cadastrada; tente reenviar o PDF."
        : "Não foi possível enviar o PDF."
    )
  }
}
