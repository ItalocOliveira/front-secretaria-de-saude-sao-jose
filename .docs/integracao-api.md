# Integração com a API

Como este frontend fala com a API descrita em [api-backend.md](./api-backend.md), e o que ainda falta do lado do backend.

## Configuração

Copie `.env.example` para `.env.local` e ajuste:

| Variável           | Vai para o bundle? | Para quê                                                                                     |
| ------------------ | :----------------: | -------------------------------------------------------------------------------------------- |
| `VITE_API_URL`     |      **Sim**       | Base de todas as chamadas. `/api` em dev (passa pelo proxy); URL pública da API em produção. |
| `API_PROXY_TARGET` |        Não         | Alvo do proxy do Vite. Só existe em dev.                                                     |

> ⚠️ `VITE_*` é **inlinada em build time**. Trocar o valor no runtime do serviço não tem efeito — é preciso rebuildar. Se o frontend for deployado na Railway, a variável precisa existir no momento do build.

### Rodando contra o mock local

```bash
pnpm api:mock     # API mockada em :3000 — credenciais em mock/README.md
pnpm dev          # frontend em :3001
```

Ou os dois num comando só: `pnpm dev:mock` (usa `concurrently`).

### Rodando contra a Railway

```bash
# .env.local
API_PROXY_TARGET=https://<serviço>.up.railway.app
```

O proxy do Vite (`vite.config.ts`) faz as requisições saírem da mesma origem, então **CORS não bloqueia em dev** — inclusive apontando para a Railway. `changeOrigin: true` é obrigatório: a Railway roteia pelo header `Host`.

Em produção não há proxy. Aí o backend **precisa** liberar CORS para a origem do frontend.

## Checklist do backend / Railway

- [ ] **Domínio público gerado** no serviço. Sem "Generate Domain" ele só existe na rede privada da Railway, inalcançável pelo navegador.
- [ ] **CORS** configurado: o header `Authorization` força preflight, então a API precisa responder `OPTIONS` e enviar `Access-Control-Allow-Origin` (origem do frontend) e `Access-Control-Allow-Headers: Authorization, Content-Type`.
- [x] ~~Confirmar `id` em `GET /apacs`~~ — `id` é garantido em `ApacDomain` (`GET`/`POST`/`PATCH`); a UI não depende mais de fallback por índice.

Cold start: serviço hobby hiberna e a primeira requisição pode levar segundos. O client usa timeout de 20s e o React Query só faz retry em erro de rede/5xx.

## Arquitetura

```
src/api/
  client.ts       # request(), ApiError, base URL, Bearer, timeout, normalização de erro
  auth.ts         # POST /auth/login, GET /auth/me
  apacs.ts        # GET/POST/PATCH/DELETE /apacs + DTO → view model + upload do PDF direto pro R2
  users.ts        # GET/POST /users
src/lib/
  session.ts      # token em sessionStorage, decode do JWT, store externo
  permissions.ts  # matriz de roles espelhada da doc
src/hooks/
  use-session.ts  # sessão reativa via useSyncExternalStore
  use-auth.ts     # login, logout, /auth/me
  use-apacs.ts    # useApacs, useCreateApac, useUpdateApac, useDeleteApac
  use-users.ts    # useUsers, useCreateUser
src/components/auth/
  require-auth.tsx, require-role.tsx, home-redirect.tsx
src/app/
  query-client.ts, router.tsx
```

Nenhum componente chama `fetch` direto — tudo passa por `src/api/client.ts`.

## Decisões

### Data fetching: TanStack Query

Dedupe, cache e invalidação após mutação vêm prontos. `staleTime` de 30s; retry só em rede/5xx (4xx é resposta definitiva); mutações nunca dão retry, para não duplicar registro.

### Token: `sessionStorage`

Registrado aqui porque o `AGENTS.md` exige documentar a escolha.

Sobrevive ao F5 — necessário, já que a API não tem refresh token e perder o token significa novo login — mas **morre ao fechar a aba**. As unidades de saúde usam terminais compartilhados; ninguém deve herdar a sessão do colega. Continua exposto a XSS, como qualquer storage acessível por JS.

Detalhes em `src/lib/session.ts`:

- chave versionada (`sjr.auth.token.v1`);
- token expirado é descartado no boot, antes de gerar um 401 garantido;
- um `setTimeout` limpa a sessão no instante do `exp`, para uma aba esquecida aberta não descobrir a expiração só na próxima requisição;
- as claims expostas ao app **omitem o `cpf`** que existe no payload do JWT, para nenhum componente conseguir renderizá-lo por descuido.

### Município pelo subdomínio (`X-Tenant`)

Comunicado: [`att-backend/2026-11-12-subdominio-por-municipio.md`](att-backend/2026-11-12-subdominio-por-municipio.md). Cada prefeitura tem um endereço `<municipio>.<uf>.icosaude.com.br`, e cada uma tem **contas separadas** (o mesmo CPF pode ter senha e cargo diferentes em cada prefeitura).

- `TENANT_SLUG` (`src/lib/tenant.ts`) lê o slug `<municipio>.<uf>` do `hostname` uma vez no carregamento (aceita `*.icosaude.com.br` e `*.localhost`). `VITE_TENANT_SLUG` força um slug quando o endereço não tem município (previews da Vercel). Sem município (`www`, `localhost`, previews sem a env) → **landing page neutra** (`src/pages/landing-page.tsx`, comunicado [`2026-11-12-landing-sem-municipio.md`](att-backend/2026-11-12-landing-sem-municipio.md)): o `TenantGate` não monta router nem login e nenhuma chamada à API é feita (`useTenant` tem `enabled: TENANT_SLUG !== undefined`). O link de transição para São José é a constante `TRANSITION_TENANT` — troque por `null` quando houver mais prefeituras.
- `request()` manda `X-Tenant` em **todas** as rotas da API, inclusive `POST /auth/login` e `GET /auth/tenant`. A API não tem mais município padrão (comunicado [`2026-11-13-x-tenant-obrigatorio.md`](att-backend/2026-11-13-x-tenant-obrigatorio.md)): sem o header, essas duas rotas dão `400 "Município não informado."` — por isso a landing não chama a API e nada deve ser chamado sem `TENANT_SLUG`. As URLs do R2 não passam por `request()` e **não** podem levar o header (assinatura).
- `TenantGate` (`src/components/auth/tenant-gate.tsx`), em volta do router, chama `GET /auth/tenant` antes de qualquer tela: `404` mostra "Município não encontrado" em vez do login; rede/5xx não bloqueia. `useTenantName()` (`src/hooks/use-tenant.ts`, cache eterno) exibe o nome no login e na sidebar. Login/logout limpam o cache com `clearKeepingTenant` para não perder o município.
- **Município suspenso** (comunicado [`2026-11-13-municipio-suspenso.md`](att-backend/2026-11-13-municipio-suspenso.md)): `GET /auth/tenant` devolve `active: false` e o `TenantGate` mostra "Acesso suspenso" no lugar do login (só `false` explícito tranca — API sem o campo segue liberada). Login dá `403` e rotas autenticadas dão `401`, ambos com a `message` da API. Como o município fica em cache eterno, o `queryClient` (`src/app/query-client.ts`) revalida `TENANT_QUERY_KEY` em todo `401`/`403`: a suspensão no meio da sessão (ou com o login aberto) troca a tela sem F5.
- `401` "Sessão de outro município" é tratado como qualquer `401` (limpa o token). O token continua no `sessionStorage`, que o navegador já separa por subdomínio — **não** mova para cookie de `.icosaude.com.br`.
- Dev: abra `http://saojosedosramos.pb.localhost:3001` (o mock conhece também `salgadodesaofelix.pb`; qualquer outro slug dá `404`). `http://localhost:3001` mostra a landing (ou defina `VITE_TENANT_SLUG` no `.env.local`).
- Vercel: `VITE_TENANT_SLUG=saojosedosramos.pb` no ambiente **Preview** (senão os previews só mostram a landing) e **vazia** em Production (preenchida, até o `www` viraria aquele município). O domínio `*.pb.icosaude.com.br` precisa estar ativo antes do deploy da landing, ou quem usa o `www` fica sem acesso.

### Sessão sem Context

`session.ts` é um store externo consumido por `useSyncExternalStore`. Assim o client HTTP derruba a sessão ao receber `401` e as guardas de rota reagem sozinhas, sem `useEffect` e sem provider.

### Dados sensíveis

- `cns` e `cpf` agora chegam em **texto puro** da API (deixaram de ser criptografados). Continuam dado pessoal de saúde: entram no view model `Apac` só para o `ApacDetailsDialog` exibi-los sob demanda — não vão para log, `localStorage`, query string, nem para o formulário de edição (`PATCH` não os altera).
- A busca da listagem filtra por nome e município apenas — CNS/CPF não entram na busca, mesmo aparecendo no detalhe.
- `ApiError.details` (o corpo cru do erro) nunca é exibido nem logado. A API deixou de mandar `details` nos `500`, mas o corpo continua vindo de fora. As telas mostram só `error.message`, normalizado em `src/api/client.ts` como `message ?? error`; os `400`/`413` do validador de schema (que vêm em inglês, ex.: `body/name must be string`) viram a mensagem genérica em português, e os campos já têm `maxLength` (`src/lib/field-limits.ts`) para o caso nem acontecer.
- `429` (rate limit: 300 req/min por IP; login: 10/min por IP e 5 em 15 min por CPF) mostra a mensagem da API e **não** é repetido: o `retry` do React Query ignora todo `4xx`. A busca das listagens tem debounce (`useDebouncedValue`) para não gastar uma requisição por tecla.

### Edição e exclusão de APAC

`PATCH /apacs/:id` aceita `name`, `acs`, `procedure`, `municipality` e `status` — todos opcionais, e o front (`ApacEditDialog` em `src/components/apacs/apac-edit-dialog.tsx`) só envia os campos que o usuário de fato alterou (`cns`, `priority`, `birth_date` e `cpf` não são editáveis por esse endpoint). É esse mesmo formulário que resolve a transição de status (aprovar/negar/etc.) — não existe um endpoint dedicado só pra isso. `PATCH`/`DELETE` com `id` inexistente (ou de outro município) devolvem `404`; `ApacDeleteAlert`, `ItemDeleteAlert` e `DocumentDeleteAlert` tratam o `404` como "já não existe" (aviso leve + lista invalidada). As duas ações ficam no diálogo de detalhes (`ApacDetailsDialog`, aberto pela tabela `ApacsTableCard`): editar para todas as roles de `/apacs` (`APAC_ROLES`), excluir só para `APAC_DELETE_ROLES` — o `RECEPCIONISTA` não vê o botão (`src/lib/permissions.ts`).

### Anexo de PDF: upload direto pro R2

`POST /apacs` devolve `{ apac, uploadUrl }`. O backend nunca recebe o PDF — o front faz um `PUT` direto para `uploadUrl` (presigned do Cloudflare R2, válida por **15 min**) com o binário do arquivo, sem `Authorization` e sem passar por `request()` (`uploadApacPdf` em `src/api/apacs.ts` usa `fetch` cru de propósito). O objeto é salvo no bucket como `apacs/<id>.pdf`.

O `PUT` leva `Content-Type: application/pdf` (obrigatório: a URL é assinada com ele) e, depois dele, o front **sempre** chama `POST /apacs/:id/pdf/confirm` — a API confere o arquivo no bucket e marca `has_pdf: true` (`409` se não chegou). Fluxo inteiro em `attachApacPdf` / `useAttachApacPdf`. Contrato em [temp/CONTRATO_PDF_APACS.md](temp/CONTRATO_PDF_APACS.md).

Se o envio falhar (link expirado, rede caiu), a APAC **já existe** — o form (`ApacFormSheet`) não repete o `POST`; o reenvio pede uma URL nova (`POST /apacs/:id/pdf/upload-url`), então nem um link expirado trava. A mesma rota permite anexar ou substituir o PDF de uma APAC já cadastrada, pelo botão "Anexar PDF" / "Substituir PDF" do `ApacEditDialog`.

**CORS do bucket**: o `PUT` sai do navegador direto pro R2, então o bucket precisa de uma CORS Policy própria (separada da API) liberando a origem do front, método `PUT` (e `GET`, pro download) e o header `content-type` — sem isso o preflight falha com `blocked by CORS policy` e o front cai no mesmo tratamento de erro de rede (não dá pra distinguir os dois no `catch`). Configuração é no painel do bucket (R2 → bucket → Settings → CORS Policy), não no código.

`GET /apacs` também devolve um `pdf_url` (presigned de download, válido por 1h, gerado a cada chamada, mesmo que nenhum PDF tenha sido enviado ainda) em cada item — sem PDF o link dá 404, então quem decide é `has_pdf`: `toApac` só preenche `pdfUrl` quando `has_pdf` é `true`. `ApacsTableCard` e `ApacDetailsDialog` mostram um botão "Ver PDF" que abre `pdfUrl` em nova aba (`target="_blank"`) quando há PDF; o navegador renderiza o PDF nativamente, então o front não precisa de viewer, download ou impressão próprios.

## O que está integrado

| Tela                                 | Endpoint            |
| ------------------------------------ | ------------------- |
| `/login`                             | `POST /auth/login`  |
| `/apacs` — listagem, cards e filtros | `GET /apacs`        |
| `/apacs` — formulário de cadastro    | `POST /apacs`       |
| `/apacs` — edição                    | `PATCH /apacs/:id`  |
| `/apacs` — exclusão                  | `DELETE /apacs/:id` |
| `/usuarios`                          | `GET /users`        |
| `/usuarios/novo`                     | `POST /users`       |

Foto dos itens do almoxarifado ([comunicado 2026-11-12](att-backend/2026-11-12-imagem-itens-almoxarifado.md)): mesmo fluxo do PDF das APACs — `POST /itens/:id/image/upload-url` → `PUT` direto no R2 (com `Content-Type: file.type`) → `POST /itens/:id/image/confirm`. O cadastro (`POST /itens`) reaproveita a `uploadUrl` da resposta, mas também precisa do `confirm`. Quem diz se há foto é `has_image`, não `image_url`. Tudo em `attachItemImage` (`src/api/itens.ts`) / `useAttachItemImage`; o botão "Adicionar/Trocar imagem" é `ItemImageUploadButton`, nos detalhes e na edição do produto.

Rotas são guardadas por autenticação (`RequireAuth`) e por perfil (`RequireRole`), e a sidebar esconde o que o perfil não alcança. A matriz segue [`.docs/temp/PERMISSOES.md`](temp/PERMISSOES.md) (todos acessam tudo, exceto `RECEPCIONISTA`: sem usuários, almoxarifado e exclusão de APAC; em ofícios só cria — a tela mostra o formulário e não chama `GET /documents`). Hoje todos veem APACs e caem em `/apacs`, mas `homeRouteFor()` continua decidindo o destino pós-login, para o caso de a matriz voltar a ter cargos sem APACs.

## Lacunas do contrato

O que a UI precisaria e a API não oferece. Nada disso foi simulado com dado falso — os campos foram **removidos** da tela em vez de coletados e descartados em silêncio.

| Lacuna                                                          | Impacto                                                                                                        |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `GET /auth/me` não devolve `name`                               | O menu do usuário mostra o perfil (Regulador, Diretor…) no lugar do nome.                                      |
| Sem nº da APAC, código SIGTAP, CID, médico solicitante, unidade | Campos removidos do formulário — `procedure` é texto livre, mas continua sem esses campos dedicados.           |
| Listagens paginadas, sem agregação                              | Os cards de status da tela de APACs vêm de `countByStatus` do `POST /reports/apacs`, não do tamanho da página. |

Ainda mockada, por não existir no contrato: a lista de municípios (ver `src/data/apacs-mock.ts`).

## Listagens paginadas

`GET /apacs`, `/documents`, `/itens` e `/users` devolvem `{ data, pagination: { page, pageSize, total, totalPages } }` (até 100 por página; padrão 50). Contrato completo em [`.docs/temp/MUDANCAS_CONTRATO_SEGURANCA.md`](temp/MUDANCAS_CONTRATO_SEGURANCA.md).

- `src/api/pagination.ts`: tipos (`ListParams`, `Paginated`) e `toListQuery()`, que monta `page`/`pageSize`/`search`/`status` omitindo o que está vazio. `search` filtra **só por nome** — CPF/CNS nunca vão para a URL.
- Cada `use<Recurso>(params)` põe os parâmetros na `queryKey` e usa `keepPreviousData` (a página anterior fica na tela até a nova chegar). As mutações invalidam pelo prefixo (`["apacs"]` etc.), então qualquer página aberta é atualizada.
- A tela é dona da página e dos filtros; as tabelas (`ApacsTableCard`, `DocumentsTableCard`, `ItensTableCard`, `UsersPage`) só exibem a página recebida e usam `ListPagination` (`src/components/list-pagination.tsx`). Trocar busca/status volta para a página 1.
- Filtros extras de `GET /apacs` (todos na query string, combináveis, `total` considera todos): `priority`; `municipality` (nome inteiro, sem diferenciar maiúsculas, acentos contam — `NAO_INFORMADO` traz as APACs sem município); `startDate`/`endDate` em `YYYY-MM-DD` pela data de criação (a API usa o dia inteiro no horário da Paraíba, então o front não converte fuso; cada um vale sozinho). Formato inválido ou `startDate` depois de `endDate` → `400` em português. `toApacListFilters` (`src/lib/apac-filters.ts`) faz a conversão; o select de municípios usa a mesma lista do cadastro (`MUNICIPALITIES`) para a grafia bater.
- Tamanhos de página: APACs 6, Pendências 10, ofícios 10, almoxarifado 10, usuários 20.
- Ordem vem da API: mais recentes primeiro (APACs, ofícios, itens); usuários em ordem alfabética.
- `POST /users`: só `DEV` cria `DEV` — o select de perfil esconde a opção para os demais (`creatableRolesFor` em `src/lib/permissions.ts`); CPF repetido devolve `409`.
- Relatório: período personalizado limitado a 366 dias (`REPORT_MAX_DAYS`, aplicado no `DateRangePicker` via `maxDays`).
