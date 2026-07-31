import type { ApacAcs, ApacPriority, ApacProcedure, ApacStatus } from "@/lib/apac"
import { request } from "@/api/client"

/**
 * Objeto devolvido por `GET /apacs`, `POST /apacs` e `PATCH /apacs/:id`
 * (`ApacDomain` no backend). `id` é garantido pela API.
 */
export type ApacDto = {
  id: string
  name: string
  /** Texto puro (não é mais criptografado pela API) — ainda é dado pessoal de saúde. */
  cns: string
  /** Texto puro, quando informado — mesmo cuidado do `cns`. */
  cpf?: string | null
  procedure: ApacProcedure
  priority: ApacPriority
  status: ApacStatus
  /** ACS (Agente Comunitário de Saúde) responsável. Editável via `PATCH`. */
  acs: ApacAcs
  birth_date?: string | null
  municipality?: string | null
  createdAt: string
  updatedAt: string
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
 * `cns` e `cpf` ficam de fora de propósito: são dado pessoal de saúde e nenhuma
 * tela (nem o formulário de edição, que não os altera) precisa deles. Deixá-los
 * fora do view model garante que nenhum componente os renderize por descuido.
 */
export type Apac = {
  id: string
  name: string
  procedure: ApacProcedure
  priority: ApacPriority
  status: ApacStatus
  /** ACS responsável — editável via `PATCH`. */
  acs: ApacAcs
  municipality: string | null
  birthDate: string | null
  createdAt: string
  updatedAt: string
  /** Presigned URL de download do PDF, válida por 1h. `null` se a API não mandar. */
  pdfUrl: string | null
}

export function toApac(dto: ApacDto): Apac {
  return {
    id: dto.id,
    name: dto.name,
    procedure: dto.procedure,
    priority: dto.priority,
    status: dto.status,
    acs: dto.acs,
    municipality: dto.municipality ?? null,
    birthDate: dto.birth_date ?? null,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
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
  return { apac: toApac(data.apac), uploadUrl: data.uploadUrl }
}

/**
 * Campos aceitos em `PATCH /apacs/:id` — todos opcionais, envie só o que muda.
 * `cns`, `priority`, `birth_date`, `cpf` e `status` não são editáveis por aqui.
 */
export type UpdateApacPayload = {
  name?: string
  acs?: ApacAcs
  procedure?: ApacProcedure
  municipality?: string
}

export async function updateApac(id: string, payload: UpdateApacPayload): Promise<Apac> {
  const data = await request<ApacDto>(`/apacs/${id}`, { method: "PATCH", body: payload })
  return toApac(data)
}

/** Sem 404 no contrato: se o `id` não existir, a API responde `500`. */
export async function deleteApac(id: string): Promise<void> {
  await request<undefined>(`/apacs/${id}`, { method: "DELETE" })
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
