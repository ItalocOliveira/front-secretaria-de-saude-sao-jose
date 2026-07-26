/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base das chamadas de API. Ver `.env.example`. */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
