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

### Sessão sem Context

`session.ts` é um store externo consumido por `useSyncExternalStore`. Assim o client HTTP derruba a sessão ao receber `401` e as guardas de rota reagem sozinhas, sem `useEffect` e sem provider.

### Dados sensíveis

- `cns` e `cpf` agora chegam em **texto puro** da API (deixaram de ser criptografados), mas continuam **fora** do view model `Apac` — o `PATCH` de edição não os altera (só `name`, `acs`, `procedure`, `municipality`), então nenhuma tela precisa deles.
- A busca da listagem filtra por nome e município apenas, pela mesma razão.
- `ApiError.details` (o corpo cru do erro) nunca é exibido nem logado: o `500` de `POST/PATCH /apacs` pode devolver os dados do paciente que falharam na validação. As telas mostram só `error.message`, que é normalizado.

### Edição e exclusão de APAC

`PATCH /apacs/:id` aceita `name`, `acs`, `procedure` e `municipality` — todos opcionais, e o front (`ApacEditDialog` em `src/components/apacs/apac-edit-dialog.tsx`) só envia os campos que o usuário de fato alterou (`cns`, `priority`, `birth_date`, `cpf` e `status` não são editáveis por esse endpoint). `DELETE /apacs/:id` (`ApacDeleteAlert`) não tem confirmação de existência prévia: a API não devolve `404`, um `id` inexistente cai em `500`. As duas ações ficam disponíveis na tabela (`ApacsTableCard`) e no diálogo de detalhes (`ApacDetailsDialog`), disponíveis para as mesmas roles que já acessam `/apacs` (`APAC_ROLES` em `src/lib/permissions.ts`).

### Anexo de PDF: upload direto pro R2

`POST /apacs` devolve `{ apac, uploadUrl }`. O backend nunca recebe o PDF — o front faz um `PUT` direto para `uploadUrl` (presigned do Cloudflare R2, válida por **15 min**) com o binário do arquivo, sem `Authorization` e sem passar por `request()` (`uploadApacPdf` em `src/api/apacs.ts` usa `fetch` cru de propósito). O objeto é salvo no bucket como `apacs/<id>.pdf`.

Se o `PUT` falhar (link expirado, rede caiu), a APAC **já existe** — o form (`ApacFormCard`) não repete o `POST`, só oferece reenviar o mesmo arquivo pra mesma `uploadUrl`. Não há endpoint pra regerar a URL isoladamente; se ela já expirou, o reenvio falha de novo e hoje não há recuperação pela UI.

**CORS do bucket**: o `PUT` sai do navegador direto pro R2, então o bucket precisa de uma CORS Policy própria (separada da API) liberando a origem do front, método `PUT` (e `GET`, pro download) e o header `content-type` — sem isso o preflight falha com `blocked by CORS policy` e o front cai no mesmo tratamento de erro de rede (não dá pra distinguir os dois no `catch`). Configuração é no painel do bucket (R2 → bucket → Settings → CORS Policy), não no código.

`GET /apacs` também devolve um `pdf_url` (presigned de download, válido por 1h, gerado a cada chamada, mesmo que nenhum PDF tenha sido enviado ainda) em cada item — tipado como opcional em `ApacDto`/`Apac`. `ApacsTableCard` e `ApacDetailsDialog` mostram um botão "Ver PDF" que abre `pdfUrl` em nova aba (`target="_blank"`) sempre que o campo vier preenchido; o navegador renderiza o PDF nativamente, então o front não precisa de viewer, download ou impressão próprios.

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

Rotas são guardadas por autenticação (`RequireAuth`) e por perfil (`RequireRole`), e a sidebar esconde o que o perfil não alcança. Como `SECRETARIA` não vê APACs e `RECEPCIONISTA`/`REGULADOR` não veem usuários, **não existe home única**: `homeRouteFor()` decide o destino pós-login.

## Lacunas do contrato

O que a UI precisaria e a API não oferece. Nada disso foi simulado com dado falso — os campos foram **removidos** da tela em vez de coletados e descartados em silêncio.

| Lacuna                                                          | Impacto                                                                                                                    |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `GET /auth/me` não devolve `name`                               | O menu do usuário mostra o perfil (Regulador, Diretor…) no lugar do nome.                                                  |
| Sem nº da APAC, código SIGTAP, CID, médico solicitante, unidade | Campos removidos do formulário — `procedure` só aceita `EXAME`/`CIRURGIA`.                                                 |
| Sem endpoint pra regerar `uploadUrl` isoladamente               | Se o `PUT` pro R2 falhar após os 15 min de validade, não há como recuperar o envio pela UI — só reenviar antes de expirar. |
| `PATCH /apacs/:id` não aceita `status`                          | Transição de status (aprovar/negar) não existe; o botão "Alterar situação" no diálogo fica desabilitado.                   |
| Sem endpoint de agregação                                       | Os cards contam sobre a lista já carregada. Se a listagem ganhar paginação, será preciso um `GET /apacs/stats`.            |
| Sem query params documentados                                   | Filtro e ordenação são client-side (`src/lib/apac-filters.ts` é o ponto de troca).                                         |

Ainda mockada, por não existir no contrato: a lista de municípios (ver `src/data/apacs-mock.ts`).
