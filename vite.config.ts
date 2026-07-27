import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Prefixo vazio: `API_PROXY_TARGET` não é `VITE_*` de propósito, para o alvo do
  // proxy não vazar para dentro do bundle.
  const env = loadEnv(mode, process.cwd(), "")
  const apiProxyTarget = env.API_PROXY_TARGET || "http://localhost:3000"

  // Falha o build quando `VITE_API_URL` não é absoluta. O proxy abaixo é do dev
  // server e não sobrevive ao build, então uma base relativa geraria um bundle que
  // chama a origem do próprio front e toma 404 no primeiro login. Melhor quebrar o
  // deploy aqui do que publicar um front que não consegue autenticar.
  if (mode === "production" && !/^https?:\/\//.test(env.VITE_API_URL ?? "")) {
    throw new Error(
      `VITE_API_URL deve ser a URL absoluta da API em builds de produção (recebido: "${env.VITE_API_URL ?? ""}").\n` +
        `Defina-a nas env vars do host (Vercel → Settings → Environment Variables), ex.:\n` +
        `  VITE_API_URL=https://secretaria-de-saude-sao-jose.onrender.com`
    )
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 3001,
      proxy: {
        // O front chama `/api/*` e o Vite repassa para a API. Como a requisição sai
        // da mesma origem, não há preflight e o CORS deixa de bloquear em dev —
        // inclusive apontando direto para a Railway.
        "/api": {
          target: apiProxyTarget,
          changeOrigin: true, // a Railway roteia pelo header Host; sem isso, 404.
          rewrite: (requestPath) => requestPath.replace(/^\/api/, ""),
        },
      },
    },
  }
})
