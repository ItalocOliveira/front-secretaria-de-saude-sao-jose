# 2026-11-12 — Landing page em `icosaude.com.br` (endereço sem município)

Complementa `2026-11-12-subdominio-por-municipio.md`. **Não muda nada na API**: é uma mudança só
do front.

## Problema

`icosaude.com.br` / `www.icosaude.com.br` não têm município no endereço, então o front não manda
`X-Tenant` e a API cai no município padrão (São José dos Ramos). Resultado: o domínio principal
abre o sistema de São José, com login e tudo. Cada prefeitura já tem o próprio endereço
(`saojosedosramos.pb.icosaude.com.br`), então o domínio principal deve ser **neutro**.

## O que fazer

Quando `TENANT_SLUG` (`src/lib/tenant.ts`) for `undefined`, o app mostra **só uma landing page
simples** e não monta mais nada:

- sem router, sem tela de login, sem sidebar;
- **sem nenhuma chamada à API** (nem `GET /auth/tenant`): sem município não há o que consultar.

### Onde

No `TenantGate` (`src/components/auth/tenant-gate.tsx`), antes do `useTenant()`:

```tsx
import { TENANT_SLUG } from "@/lib/tenant"
import { LandingPage } from "@/pages/landing-page"

export function TenantGate({ children }: { children: ReactNode }) {
  // Domínio principal / www: sem município no endereço → landing neutra, sem API.
  if (TENANT_SLUG === undefined) return <LandingPage />

  return <TenantGateWithTenant>{children}</TenantGateWithTenant> // o conteúdo atual do gate
}
```

Separe o conteúdo atual num componente próprio (como `TenantGateWithTenant` acima) para não chamar
`useTenant()` condicionalmente (regra dos hooks). E desligue a query quando não houver município, por
segurança (`enabled: TENANT_SLUG !== undefined` em `useTenant`), para nenhuma outra tela disparar o
`GET /auth/tenant` sem header.

### Quando vale a landing

| Endereço                                          | `TENANT_SLUG`        | Mostra      |
| ------------------------------------------------- | -------------------- | ----------- |
| `icosaude.com.br`, `www.icosaude.com.br`          | `undefined`          | **Landing** |
| `saojosedosramos.pb.icosaude.com.br`              | `saojosedosramos.pb` | Sistema     |
| `localhost:3001` (dev)                            | `undefined`          | **Landing** |
| `saojosedosramos.pb.localhost:3001` (dev)         | `saojosedosramos.pb` | Sistema     |
| Preview `*.vercel.app` **com** `VITE_TENANT_SLUG` | o da variável        | Sistema     |
| Preview `*.vercel.app` **sem** `VITE_TENANT_SLUG` | `undefined`          | **Landing** |

Consequências para configurar:

- **Previews da Vercel:** defina `VITE_TENANT_SLUG=saojosedosramos.pb` nas env vars do ambiente
  **Preview** (não em Production), senão os previews passam a abrir só a landing.
- **Dev local:** para usar o sistema, abra `http://saojosedosramos.pb.localhost:3001`. Ou defina
  `VITE_TENANT_SLUG` no `.env.local`.
- **Production:** `VITE_TENANT_SLUG` **vazia**. Com ela preenchida, todo endereço (inclusive o `www`)
  seria tratado como aquele município.

## Conteúdo da landing (placeholder)

Simples, uma tela só, centralizada, respeitando o tema claro/escuro já existente:

- Logo do ICOS (`/logo_icos.png`) e o nome **ICOS**.
- Uma frase: "Sistema de gestão para secretarias municipais de saúde."
- Um aviso para quem já usa: "Já é cliente? Acesse pelo endereço da sua prefeitura:
  `<municipio>.<uf>.icosaude.com.br`."
- **Durante a transição**, um link discreto: "Servidor de São José dos Ramos? Acesse
  `saojosedosramos.pb.icosaude.com.br`" → `https://saojosedosramos.pb.icosaude.com.br`. Quem tem o
  `www` salvo nos favoritos chega lá. Deixe esse link fácil de remover (uma constante ou um bloco
  isolado), porque ele sai quando houver mais prefeituras.
- Rodapé com o ano e "ICOS".

Não use nada específico de São José na landing: nem `logo_prefeitura.png`, nem
`logo_secretaria.png`, nem o nome do município fora do link de transição.

## Título da aba

O `index.html` já tem o título neutro "ICOS — Secretaria de Saúde", e é ele que aparece na
landing. Nos endereços de município, o `TenantGate` continua trocando para "ICOS — Secretaria de
Saúde de <município>" depois que o `GET /auth/tenant` responde. Não precisa mudar nada aqui; só não
ponha o nome de um município no `index.html`.

## Sessões existentes no `www`

Quem estiver logado no `www` perde o acesso por lá: a landing não mostra o sistema. Isso é
esperado. A sessão fica no `sessionStorage` do `www`, que é separado do endereço do município, e o
usuário entra de novo em `saojosedosramos.pb.icosaude.com.br`. O link de transição cobre isso.

## Checklist

- [ ] `src/pages/landing-page.tsx` com o conteúdo acima
- [ ] `TenantGate` mostra a landing quando `TENANT_SLUG === undefined`, sem chamar a API
- [ ] `useTenant` com `enabled: TENANT_SLUG !== undefined`
- [ ] `VITE_TENANT_SLUG=saojosedosramos.pb` no ambiente **Preview** da Vercel; vazia em Production
- [ ] Testado: `localhost:3001` → landing; `saojosedosramos.pb.localhost:3001` → sistema
- [ ] Em produção: `www.icosaude.com.br` → landing; `saojosedosramos.pb.icosaude.com.br` → sistema
