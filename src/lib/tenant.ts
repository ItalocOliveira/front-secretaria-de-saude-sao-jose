/**
 * Município (tenant) a partir do endereço do front — comunicado
 * `.docs/att-backend/2026-11-12-subdominio-por-municipio.md`.
 *
 * Cada prefeitura tem um endereço `<municipio>.<uf>.icosaude.com.br`; o slug
 * (`<municipio>.<uf>`) vai no header `X-Tenant` de toda chamada à API.
 */

const TENANT_HOST_PATTERN = /^([a-z0-9]+(?:-[a-z0-9]+)*\.[a-z]{2})\.(?:icosaude\.com\.br|localhost)$/

/**
 * Slug do município (`<municipio>.<uf>`) a partir do endereço do front.
 * `undefined` = sem município no endereço (www, domínio principal, previews): a API usa São José.
 * A UF não é validada aqui: slug inexistente vira `404` em `GET /auth/tenant`.
 */
function readTenantSlug(): string | undefined {
  // Previews da Vercel não têm subdomínio de município.
  const override = import.meta.env.VITE_TENANT_SLUG
  if (override) {
    return override.toLowerCase()
  }

  // `hostname` já vem sem porta.
  return window.location.hostname.toLowerCase().match(TENANT_HOST_PATTERN)?.[1]
}

/** Calculado uma vez: o endereço não muda durante a sessão. */
export const TENANT_SLUG = readTenantSlug()
