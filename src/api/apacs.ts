import type { ApacPriority, ApacProcedure, ApacStatus } from "@/lib/apac"
import { request } from "@/api/client"

/**
 * Objeto devolvido por `GET /apecs` e `POST /apecs`.
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
  }
}

/** Campos aceitos em `POST /apecs`. `status` não entra: a API cria como `PENDENTE`. */
export type CreateApacPayload = {
  name: string
  cns: string
  procedure: ApacProcedure
  priority: ApacPriority
  birth_date?: string
  cpf?: string
  municipality?: string
}

export async function listApacs(signal?: AbortSignal) {
  const data = await request<ApacDto[]>("/apecs", { signal })
  return data.map(toApac)
}

export function createApac(payload: CreateApacPayload) {
  return request<ApacDto>("/apecs", { method: "POST", body: payload })
}
