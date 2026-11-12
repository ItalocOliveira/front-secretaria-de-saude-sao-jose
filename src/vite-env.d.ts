/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base das chamadas de API. Ver `.env.example`. */
  readonly VITE_API_URL?: string
  /** Força o município (`<municipio>.<uf>`) quando o endereço não tem um — previews. Ver `src/lib/tenant.ts`. */
  readonly VITE_TENANT_SLUG?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
