# 2026-11-12 — Município pelo subdomínio (`X-Tenant`)

Branch da API: `feat/subdominio-municipio-uf` (a base, `X-Tenant` e `GET /auth/tenant`, já está em
produção desde o merge de `multi-tenant`). Mudança **aditiva e compatível**: sem o header novo, a
API continua tratando tudo como São José dos Ramos, então o front atual segue funcionando enquanto
isto é implementado.

## O que muda, em uma frase

Cada prefeitura passa a ter um endereço próprio, **`<municipio>.<uf>.icosaude.com.br`**
(ex.: `saojosedosramos.pb.icosaude.com.br`). O front lê esse endereço, descobre o município e manda
o identificador dele no header **`X-Tenant`** em todas as chamadas. A API usa o header para saber em
qual prefeitura a pessoa está entrando.

Por que isso existe: a mesma pessoa pode trabalhar para mais de uma prefeitura. Cada prefeitura tem
**contas separadas** (mesmo CPF, senha e cargo próprios em cada uma), e o login precisa saber de
qual prefeitura é a tentativa.

## Resumo do que o front precisa fazer

1. Ler o slug do município a partir do `hostname` (seção 1).
2. Mandar `X-Tenant: <slug>` em **todas** as chamadas à API, no `src/api/client.ts` (seção 2).
3. Ao abrir o app, chamar `GET /auth/tenant` para validar o endereço e pegar o nome do município;
   mostrar uma tela "Município não encontrado" no `404` (seção 3).
4. Mostrar o nome do município na tela de login e no layout (seção 3).
5. Tratar o novo `401` "Sessão de outro município" como sessão expirada (seção 5).
6. Conferir a mensagem do `409` de CPF repetido em `POST /users` (seção 6).

---

## 1. Descobrir o município pela URL

O **slug** é a parte do endereço antes de `.icosaude.com.br`, sempre com dois níveis:
`<municipio>.<uf>`.

| Endereço                                  | Slug (`X-Tenant`)                             |
| ----------------------------------------- | --------------------------------------------- |
| `saojosedosramos.pb.icosaude.com.br`      | `saojosedosramos.pb`                          |
| `salgadodesaofelix.pb.icosaude.com.br`    | `salgadodesaofelix.pb`                        |
| `saojosedosramos.pb.localhost:3001` (dev) | `saojosedosramos.pb`                          |
| `www.icosaude.com.br`, `icosaude.com.br`  | nenhum (não mande o header)                   |
| `*.vercel.app` (previews)                 | `VITE_TENANT_SLUG`, se definida; senão nenhum |

Sugestão (`src/lib/tenant.ts`):

```ts
/**
 * Slug do município (`<municipio>.<uf>`) a partir do endereço do front.
 * `undefined` = sem município no endereço (www, domínio principal, previews): a API usa São José.
 */
export function getTenantSlug(): string | undefined {
  // Previews da Vercel e testes não têm subdomínio de município.
  const override = import.meta.env.VITE_TENANT_SLUG as string | undefined
  if (override) return override.toLowerCase()

  const host = window.location.hostname.toLowerCase() // sem porta
  const match = host.match(/^([a-z0-9]+(?:-[a-z0-9]+)*\.[a-z]{2})\.(?:icosaude\.com\.br|localhost)$/)

  return match?.[1]
}
```

- Não valide a UF no front: a API responde `404` para slug inexistente (seção 3).
- `www.icosaude.com.br` não casa com o padrão (só um nível), então fica sem município.
- Calcule uma vez no carregamento; o endereço não muda durante a sessão.

## 2. Mandar o header em todas as chamadas

No `src/api/client.ts`, junto do `Authorization`:

```ts
import { getTenantSlug } from "@/lib/tenant"

const tenantSlug = getTenantSlug()

// ao montar os headers de cada requisição:
if (tenantSlug) headers.set("X-Tenant", tenantSlug)
```

- Vale para **todas** as rotas da API, inclusive `POST /auth/login` e `GET /auth/tenant`.
- **Não** mande o header nas URLs do Cloudflare R2 (`uploadUrl`, `pdf_url`, `image_url`): elas vão
  direto ao bucket e são assinadas; header extra pode invalidar a assinatura. Como essas chamadas
  não passam pelo `client.ts`, basta não incluir lá.
- Sem município no endereço, não mande o header (não mande `X-Tenant: ""`).

## 3. `GET /auth/tenant` (público, sem token)

Chame ao iniciar o app, **antes** da tela de login.

```ts
type TenantInfo = { name: string; slug: string }
```

| Situação                                | Resposta                                                                                  |
| --------------------------------------- | ----------------------------------------------------------------------------------------- |
| `X-Tenant` de um município cadastrado   | `200 { "name": "São José dos Ramos", "slug": "saojosedosramos.pb" }`                      |
| Sem `X-Tenant`                          | `200` com o município padrão (São José dos Ramos)                                         |
| Slug inexistente ou em formato inválido | `404 { "statusCode": 404, "error": "Not Found", "message": "Município não encontrado." }` |

O que fazer com isso:

- **`404`**: mostre uma tela própria ("Município não encontrado. Confira o endereço.") em vez do
  login. Não mostre o formulário: qualquer login ali também daria `404`.
- **`200`**: guarde `name` (ex.: num contexto/React Query com `staleTime: Infinity`) e mostre na tela
  de login ("Entrar — São José dos Ramos") e no cabeçalho do sistema. É o que deixa claro para quem
  trabalha em duas prefeituras em qual está logado.
- Use o `slug` da resposta só para exibir; para o header continue usando o do endereço.

## 4. Login (`POST /auth/login`)

Body e resposta **iguais**: `{ cpf, password }` → `{ token }`. O que muda:

- O usuário é procurado **na prefeitura do `X-Tenant`**. O mesmo CPF em outra prefeitura é outra
  conta, que pode ter senha e cargo diferentes. "Credenciais inválidas" pode significar "essa
  pessoa não tem conta nesta prefeitura".
- Novo erro: **`404` "Município não encontrado."** se o `X-Tenant` não existir. Na prática não
  acontece se a seção 3 já barrou o endereço inválido.
- O limite de 5 tentativas a cada 15 min é **por CPF e por prefeitura**.

## 5. Sessão de outro município (`401`)

Em toda rota autenticada a API confere se o token é da prefeitura do `X-Tenant`. Se não for:

```json
401 { "message": "Sessão de outro município. Faça login novamente." }
```

Trate como qualquer `401`: `clearToken()` e volta para o login (o `client.ts` já faz isso para
`401`). Pode usar a mensagem da API no aviso.

Na prática quase não acontece: o token fica no `sessionStorage`, que o navegador **separa por
endereço**. A sessão de `saojosedosramos.pb.icosaude.com.br` não aparece em
`salgadodesaofelix.pb.icosaude.com.br`, então cada prefeitura tem a própria sessão
automaticamente. Mantenha assim: **não** mova o token para um cookie com
`domain=.icosaude.com.br`, nem para outro armazenamento compartilhado entre subdomínios.

Com `X-Tenant` inexistente, as rotas autenticadas respondem `404 "Município não encontrado."`.

## 6. `POST /users`

O usuário criado continua indo para a prefeitura de quem cria. O `409` de CPF repetido agora só
acontece **na mesma prefeitura**, com a mensagem:

```json
409 { "error": "Já existe um usuário com este CPF neste município." }
```

O `client.ts` já usa a mensagem da API (`message ?? error`), então não há o que mudar no código;
só confira que a tela de cadastro mostra o texto. Cadastrar o mesmo CPF em outra prefeitura é
permitido e esperado.

## 7. Desenvolvimento local

- Abra **`http://saojosedosramos.pb.localhost:3001`** em vez de `localhost:3001`. Navegadores
  resolvem qualquer `*.localhost` para a própria máquina, sem mexer em DNS ou no arquivo `hosts`,
  e o Vite aceita esses hosts por padrão.
- `http://localhost:3001` continua funcionando, sem município (cai em São José).
- Com o proxy do Vite (`VITE_API_URL=/api`), a chamada sai da mesma origem e o `X-Tenant` passa
  normalmente. Chamando a API direto, ela aceita `localhost:3001` e `<municipio>.<uf>.localhost:3001`
  no CORS fora de produção.

## 8. Previews da Vercel

`front-secretaria-de-saude-sao-jose-*.vercel.app` não tem município no endereço. Sem
`VITE_TENANT_SLUG`, o preview cai em São José (comportamento atual). Para testar outra prefeitura
num preview, defina `VITE_TENANT_SLUG` nas env vars de Preview da Vercel.

## 9. O que **não** muda

- Todos os outros endpoints, formatos de resposta, paginação, filtros e uploads.
- `www.icosaude.com.br` continua funcionando (sem município = São José) durante a transição.
- O token (`Bearer`) e onde ele é guardado.

## 10. Ordem de entrada em produção

1. Este front publicado (funciona em `www` e já nos subdomínios).
2. Domínio `*.pb.icosaude.com.br` adicionado na Vercel (configuração de infraestrutura, fora do
   código).
3. Avisar a secretaria do endereço novo: `https://saojosedosramos.pb.icosaude.com.br`.
4. Prefeituras novas são cadastradas pela API (script), cada uma com seu endereço.

## Checklist

- [ ] `src/lib/tenant.ts` com `getTenantSlug()`
- [ ] `X-Tenant` no `client.ts` (todas as rotas da API, nenhuma do R2)
- [ ] `GET /auth/tenant` no início do app; tela "Município não encontrado" no `404`
- [ ] Nome do município no login e no cabeçalho
- [ ] `401` "Sessão de outro município" → limpa a sessão e volta ao login
- [ ] Tela de cadastro mostra a mensagem do `409` de `POST /users`
- [ ] Testado em `http://saojosedosramos.pb.localhost:3001`
