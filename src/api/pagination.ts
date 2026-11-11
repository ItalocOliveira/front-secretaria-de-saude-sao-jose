/**
 * Contrato comum das listagens paginadas (`GET /apacs`, `/documents`, `/itens`, `/users`).
 * Ver `.docs/temp/MUDANCAS_CONTRATO_SEGURANCA.md`, seção 1.
 */

/** Maior `pageSize` aceito pela API — acima disso ela responde `400`. */
export const MAX_PAGE_SIZE = 100

/** Limite de `search` na API. */
export const MAX_SEARCH_LENGTH = 100

/**
 * Query string das listagens. Tudo opcional: sem nada, a API devolve a página 1 com 50 itens.
 * `search` filtra **só por nome** (contém, sem diferenciar caixa). `status` é o valor exato do
 * enum do recurso — em `GET /users` o parâmetro também se chama `status`, mas filtra pelo `role`.
 */
export type ListParams<TStatus extends string = string> = {
  page?: number
  pageSize?: number
  search?: string
  status?: TStatus
}

export type PaginationInfo = {
  page: number
  pageSize: number
  /** Total com os mesmos filtros (`search`/`status`) aplicados. */
  total: number
  totalPages: number
}

/** Resposta das listagens. Página além da última vem com `data: []` e `total` correto. */
export type Paginated<T> = {
  data: T[]
  pagination: PaginationInfo
}

/**
 * Monta a query string, omitindo o que está vazio (`status=` ou `search=` em branco viram `400`
 * ou filtro inútil). `search` vai aparado e cortado no limite da API. `extra` leva os filtros
 * específicos do recurso, com a mesma regra de omitir o que está vazio.
 *
 * `search` só aceita **nome** — nunca coloque CPF/CNS aqui: dado de saúde não vai para URL.
 */
export function toListQuery(params: ListParams, extra: Record<string, string | undefined> = {}) {
  const query = new URLSearchParams()

  if (params.page !== undefined) {
    query.set("page", String(params.page))
  }

  if (params.pageSize !== undefined) {
    query.set("pageSize", String(Math.min(params.pageSize, MAX_PAGE_SIZE)))
  }

  const search = params.search?.trim().slice(0, MAX_SEARCH_LENGTH)
  if (search !== undefined && search !== "") {
    query.set("search", search)
  }

  if (params.status !== undefined) {
    query.set("status", params.status)
  }

  // Filtros próprios de cada recurso (ex.: `priority`/`municipality`/`startDate` em `GET /apacs`).
  for (const [key, value] of Object.entries(extra)) {
    if (value !== undefined && value !== "") {
      query.set(key, value)
    }
  }

  const text = query.toString()
  return text === "" ? "" : `?${text}`
}

export function mapPage<T, U>(page: Paginated<T>, map: (item: T) => U): Paginated<U> {
  return { data: page.data.map(map), pagination: page.pagination }
}
