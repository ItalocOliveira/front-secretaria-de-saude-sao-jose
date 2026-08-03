# AGENTS.md

Guia para agentes de código que trabalham neste repositório. Escrito em pt-BR (idioma do produto e da documentação); comandos, nomes de arquivos e termos técnicos permanecem em inglês.

## Visão geral do projeto

Frontend (SPA) da **Secretaria de Saúde de São José dos Ramos**. A aplicação consome a API descrita em [.docs/api-backend.md](.docs/api-backend.md) e gerencia dois domínios:

- **Usuários** — cadastro/listagem de contas do sistema (`/users`).
- **APACs** — Autorização de Procedimento Ambulatorial de Alta Complexidade (`/apacs`).

Autenticação é via **JWT** (`POST /auth/login`, token válido por 1 hora, enviado no header `Authorization: Bearer <token>`) com controle de acesso por **roles**.

> ⚠️ **A API é um serviço separado** — não vive neste repositório. Seu contrato (endpoints, DTOs, enums, permissões) está em [.docs/api-backend.md](.docs/api-backend.md); use-o como referência de integração, nunca como guia de setup deste projeto. O `README.md` da raiz descreve **este** frontend.

### Stack

| Camada           | Tecnologia                                                               |
| ---------------- | ------------------------------------------------------------------------ |
| Build/dev server | Vite 8 (`@vitejs/plugin-react`)                                          |
| UI               | React 19.2 (`react-dom/client`, StrictMode)                              |
| Linguagem        | TypeScript 6 (strict, `noEmit`)                                          |
| Estilo           | Tailwind CSS v4 (via `@tailwindcss/vite`, sem `tailwind.config.js`)      |
| Componentes      | shadcn/ui — style `base-nova`, primitives **Base UI** (`@base-ui/react`) |
| Ícones           | `lucide-react`                                                           |
| Gráficos         | `recharts` (via `@/components/ui/chart`)                                 |
| Datas            | `date-fns`                                                               |
| Roteamento       | `react-router` 8 (`createBrowserRouter`)                                 |
| Data fetching    | `@tanstack/react-query` 5                                                |
| Package manager  | **pnpm**                                                                 |

**Ainda não definidos** (não assuma que existem; pergunte antes de introduzir): gerenciador de formulários, framework de testes, biblioteca de validação de schema (Zod/Valibot).

### Estrutura de diretórios

```
src/
  main.tsx                    # entry: StrictMode > AppErrorBoundary > ThemeProvider > TooltipProvider > App + Toaster
  App.tsx                     # QueryClientProvider > RouterProvider
  index.css                   # Tailwind v4 + tokens shadcn (@theme inline, :root, .dark)
  vite-env.d.ts               # tipagem de import.meta.env (VITE_API_URL)
  api/                        # camada de rede — nenhum componente chama fetch direto
    client.ts                 # request(), ApiError, base URL, Bearer, timeout, normalização de erro
    auth.ts / apacs.ts / users.ts
  app/
    router.tsx                # createBrowserRouter + guardas + errorElement
    query-client.ts           # QueryClient (staleTime, política de retry)
  components/
    error-boundary.tsx        # RouteErrorBoundary (errorElement) + AppErrorBoundary (classe)
    theme-provider.tsx        # tema light/dark/system, persistido em localStorage, atalho "d"
    auth/                     # require-auth, require-role, home-redirect
    layout/                   # app-shell, app-sidebar, app-header, user-menu
    apacs/                    # componentes da tela de APACs
    ui/                       # componentes shadcn/ui — gerados pela CLI, ver regras abaixo
  hooks/
    use-mobile.ts             # useIsMobile() — breakpoint 768px
    use-session.ts            # sessão reativa (useSyncExternalStore sobre lib/session.ts)
    use-auth.ts / use-apacs.ts / use-users.ts
  lib/
    utils.ts                  # cn() = twMerge(clsx(...))
    apac.ts                   # enums do domínio (const object + union type) e labels
    session.ts                # token em sessionStorage, decode do JWT, store externo
    permissions.ts            # matriz de roles espelhada do contrato
  data/
    apacs-mock.ts             # só o que a API não fornece (municípios, unidades)
  pages/
  assets/
mock/                         # API mockada (json-server + JWT + roles) — `pnpm api:mock`
mockups/                      # protótipos HTML estáticos de referência visual (dashboard-apacs.html)
public/
.docs/
  api-backend.md              # contrato da API backend (serviço externo) — referência de integração
  integracao-api.md           # como o front consome a API: env, decisões e lacunas do contrato
.agents/skills/               # skills instaladas (shadcn, migrate-radix-to-base) — não editar à mão
README.md                     # documentação humana deste frontend
```

Documentação complementar (contratos, decisões, referências) vai em `.docs/`. Mantenha o `README.md` da raiz enxuto: stack, como rodar, scripts e links.

## Comandos de setup

```bash
pnpm install          # instala dependências (use pnpm; o lockfile é pnpm-lock.yaml)
cp .env.example .env.local   # VITE_API_URL e API_PROXY_TARGET
pnpm api:mock         # API mockada em http://localhost:3000 (JWT + roles reais)
pnpm dev              # dev server em http://localhost:3001 (HMR)
pnpm build            # tsc -b && vite build  → dist/
pnpm preview          # serve o build de produção
```

Node: use uma versão compatível com Vite 8 (Node 20.19+ / 22.12+).

O front chama `/api/*` e o Vite repassa para `API_PROXY_TARGET` (mock local ou Railway) — mesma origem, então CORS não atrapalha em dev. Detalhes, decisões e o checklist do backend estão em [.docs/integracao-api.md](.docs/integracao-api.md). Credenciais do mock: [mock/README.md](mock/README.md).

## Fluxo de desenvolvimento

### Verificações obrigatórias antes de finalizar qualquer tarefa

```bash
pnpm typecheck        # tsc --noEmit
pnpm lint             # eslint .
pnpm format           # prettier --write "**/*.{ts,tsx}"
```

Rode os três. `pnpm build` já inclui `tsc -b`, então um build quebrado por tipos é erro de código, não de configuração.

### Testes

**Não há framework de testes configurado.** Não existem scripts `test`, nem Vitest/Jest/Playwright instalados, nem arquivos `*.test.ts(x)`.

- Não invente comandos de teste nem afirme que testes passaram.
- Se for necessário adicionar testes, a escolha padrão para esta stack é **Vitest + @testing-library/react + jsdom** (integra com o `vite.config.ts` existente). Confirme com o usuário antes de instalar.
- Convenção sugerida quando adotado: `src/**/*.test.tsx` colocalizado com o componente; comando `pnpm test` / `pnpm test --run`.

Enquanto não houver testes automatizados, valide mudanças de UI rodando `pnpm dev` e verificando o comportamento no navegador (incluindo tema dark — atalho: tecla `d`).

## Estilo de código

### Formatação (Prettier — `.prettierrc`)

Não discuta estilo manualmente; rode `pnpm format`. As regras em vigor:

- **Sem ponto e vírgula** (`semi: false`)
- **Aspas duplas** (`singleQuote: false`)
- `tabWidth: 2`, `printWidth: 120`, `trailingComma: "es5"`, `endOfLine: "lf"`
- `prettier-plugin-tailwindcss` ordena classes automaticamente e também dentro de `cn()` e `cva()`

### TypeScript

`tsconfig.app.json` é estrito. Consequências práticas:

- `strict`, `noUnusedLocals`, `noUnusedParameters` — nada de variáveis/parâmetros não usados (prefixe com `_` só quando a assinatura exigir).
- `verbatimModuleSyntax` — **imports de tipo precisam de `import type`**: `import type { ReactNode } from "react"` ou `import { clsx, type ClassValue } from "clsx"`.
- `erasableSyntaxOnly` — nada de `enum`, `namespace` ou parameter properties. Use `const` objects + union types no lugar de `enum`.
- `noFallthroughCasesInSwitch` — todo `case` precisa de `break`/`return`.
- Evite `any`; prefira `unknown` + narrowing.

### Imports

- Use sempre o alias **`@/`** para código de `src/` (configurado em `vite.config.ts`, `tsconfig.json` e `tsconfig.app.json`). Não use caminhos relativos profundos (`../../lib/utils`).
- Importe direto do módulo — **não crie barrel files** (`index.ts` reexportando tudo). Barrels quebram o tree-shaking e inflam o bundle.
- Importe ícones individualmente de `lucide-react` (`import { SearchIcon } from "lucide-react"`).

### Convenções de arquivos e nomes

- Arquivos: **kebab-case** (`theme-provider.tsx`, `use-mobile.ts`, `alert-dialog.tsx`).
- Componentes: `PascalCase`. Hooks: `useCamelCase` em arquivo `use-*.ts`.
- Um componente "de página/feature" por arquivo; componentes de UI genéricos vão para `src/components/ui/`.
- Este projeto **não usa RSC** (`rsc: false`). **Nunca adicione `"use client"`.**

### ESLint

Flat config (`eslint.config.js`) com `js.recommended`, `typescript-eslint.recommended`, `react-hooks.recommended` e `react-refresh/vite`.

- `react-refresh/only-export-components`: um arquivo de componente não deve exportar não-componentes. Quando um provider precisa exportar o hook junto (caso de `theme-provider.tsx`), o padrão do repo é `/* eslint-disable react-refresh/only-export-components */` no topo — use com parcimônia; prefira separar o hook em outro arquivo.
- Nunca desabilite as regras de `react-hooks` (`exhaustive-deps` incluído) para "fazer funcionar" — corrija a dependência.

## shadcn/ui

Configuração em `components.json`: style `base-nova`, base **`base` (Base UI, não Radix)**, `baseColor: zinc`, `cssVariables: true`, `iconLibrary: lucide`, `rsc: false`.

### CLI

Use **`pnpm dlx shadcn@latest`** (o projeto usa pnpm):

```bash
pnpm dlx shadcn@latest info                  # contexto do projeto + componentes instalados
pnpm dlx shadcn@latest search @shadcn -q "…" # procurar antes de escrever UI custom
pnpm dlx shadcn@latest docs <componente>     # URLs de docs/exemplos — leia antes de usar um componente
pnpm dlx shadcn@latest add <componente>
pnpm dlx shadcn@latest add <componente> --dry-run --diff <arquivo>  # antes de atualizar algo já instalado
```

Regras:

- Todos os ~60 componentes do registry já estão instalados em `src/components/ui/`. **Confira o diretório antes de rodar `add`** — não reinstale.
- **Nunca use `--overwrite` sem aprovação explícita** do usuário; componentes em `ui/` podem ter customizações locais.
- Quando o usuário pedir um bloco/componente sem dizer o registry, **pergunte qual registry** — não assuma `@shadcn`.
- Após adicionar algo de registry de terceiros, revise o arquivo: corrija imports (`@/components/ui/...`), troque ícones para `lucide-react` e valide a composição.
- Base UI usa **`render`** para triggers customizados, **não `asChild`** (isso é Radix). Ao copiar exemplos da internet, converta.

### Regras críticas de composição

- **Formulários**: `FieldGroup` + `Field` + `FieldLabel` + `FieldDescription`. Nunca `div` com `space-y-*` para layout de formulário.
- **Validação**: `data-invalid` no `Field`, `aria-invalid` no controle. Desabilitado: `data-disabled` no `Field`, `disabled` no controle.
- **Itens sempre dentro do Group**: `SelectItem` → `SelectGroup`, `DropdownMenuItem` → `DropdownMenuGroup`, `CommandItem` → `CommandGroup`, `TabsTrigger` → `TabsList`.
- **Dialog/Sheet/Drawer sempre precisam de Title** (`className="sr-only"` se não for visível).
- **Card completo**: `CardHeader`/`CardTitle`/`CardDescription`/`CardContent`/`CardFooter` — não jogue tudo em `CardContent`.
- **`Avatar` sempre com `AvatarFallback`.**
- **Botão com loading**: não existe `isLoading`/`isPending`. Componha `Spinner` + `data-icon` + `disabled`.
- **Use o componente existente** em vez de markup custom: `Alert` para callouts, `Empty` para estados vazios, `Badge` em vez de span estilizado, `Separator` em vez de `<hr>`, `Skeleton` em vez de `animate-pulse` manual.
- **Toast**: este projeto é Base UI — use `import { toast } from "@/components/ui/toast"` e `toast.add({ title, description })`. **Não use `sonner`.**

### Regras de estilo (Tailwind)

- **Cores semânticas sempre**: `bg-background`, `text-muted-foreground`, `bg-primary`, `border-border`. **Nunca** valores crus como `bg-blue-500` ou `text-emerald-600`.
- **Nunca escreva `dark:` para cores** — os tokens em `src/index.css` já resolvem o tema. Ajustes de tema vão no `src/index.css` (blocos `:root` / `.dark`), nunca em um novo arquivo CSS.
- `className` serve para **layout**, não para sobrescrever cor/tipografia de componentes.
- **Sem `space-x-*` / `space-y-*`** → use `flex gap-*` ou `flex flex-col gap-*`.
- **`size-*`** quando largura == altura (`size-10`, não `w-10 h-10`).
- **`truncate`** em vez de `overflow-hidden text-ellipsis whitespace-nowrap`.
- **`cn()`** para classes condicionais — nada de template literals com ternário.
- **Sem `z-index` manual** em overlays (Dialog, Sheet, Popover gerenciam o próprio stacking).
- **Ícones em `Button`**: `data-icon="inline-start"` / `"inline-end"`, **sem classes de tamanho** (`size-4` é errado — o componente dimensiona).

## Boas práticas React (Vercel)

Não há RSC nem SSR aqui — as categorias que importam são **bundle**, **data fetching client-side**, **re-render** e **rendering**.

### Bundle

- Sem barrel imports; importe o módulo direto.
- Componentes pesados (charts/Recharts, calendário, editores, tabelas grandes) devem entrar por `React.lazy()` + `<Suspense>`.
- Carregue módulos só quando a feature for ativada; adie scripts de terceiros para depois da hidratação.

### Data fetching (client)

- Dispare requisições independentes em paralelo com `Promise.all()` — nunca `await` sequencial de coisas que não dependem entre si.
- Deduplique requisições (SWR/TanStack Query quando adotado); não faça o mesmo `fetch` em vários componentes.
- Listeners globais (`scroll`, `resize`) devem ser deduplicados e `{ passive: true }` para scroll.
- `localStorage`: versione o schema, guarde o mínimo, e faça cache da leitura (não leia dentro de render/loop).

### Re-render

- Derive estado **durante o render**, não em `useEffect`. `useEffect` é para sincronizar com sistemas externos.
- Não assine estado que só é usado dentro de callbacks — use ref ou functional `setState`.
- `useState(() => valorCaro)` para inicialização custosa; dependências de efeito devem ser **primitivas**.
- `startTransition` / `useDeferredValue` para updates não urgentes (filtros, busca em listas de APACs).
- **Nunca defina componentes dentro de componentes.**
- Não memoize expressões primitivas triviais — `useMemo` tem custo.

### Rendering

- Ternário em vez de `&&` para render condicional (evita renderizar `0`/`""`).
- Extraia JSX estático para fora do componente.
- `content-visibility` para listas longas.
- Prefira `useTransition` para estado de loading de ações.

## Integração com a API

Contrato em [.docs/api-backend.md](.docs/api-backend.md); como este frontend consome, em [.docs/integracao-api.md](.docs/integracao-api.md) (env, decisões, lacunas). Pontos que o código precisa respeitar:

- **Nunca chame `fetch` direto.** Toda requisição passa por `request()` em `src/api/client.ts`, que injeta o `Bearer`, aplica timeout e normaliza o erro em `ApiError`. Endpoints novos viram funções em `src/api/<recurso>.ts` e são consumidos por um hook em `src/hooks/use-<recurso>.ts`.
- **Base URL**: `import.meta.env.VITE_API_URL` (`/api` em dev, via proxy do Vite). Nunca hardcoded. `VITE_*` é inlinada em **build time** — trocar no runtime não tem efeito.
- **Auth**: token JWT em `sessionStorage` via `src/lib/session.ts` (store externo, consumido por `useSession()`). Expira em **1h**, sem refresh. O client limpa o token em `401`, e as guardas de rota reagem sozinhas.
- **Roles**: use `src/lib/permissions.ts` (`canAccessApacs`, `canManageUsers`, `homeRouteFor`) em vez de repetir a matriz. Rotas são protegidas por `RequireAuth` + `RequireRole`; a sidebar esconde o que o perfil não alcança. Como `SECRETARIA` não vê APACs e `RECEPCIONISTA`/`REGULADOR` não veem usuários, **não existe home única**.
- **Enums de APAC**: `priority` = `URGENTE` | `NORMAL`; `status` = `PENDENTE` → `AGUARDO` → `APROVADO` | `CANCELADO` | `NEGADO`. `status` **não** é enviado na criação. `acs` (Agente Comunitário de Saúde) é uma lista fixa de 14 pessoas, **obrigatória** em `POST /apacs` — não deriva de nenhum outro endpoint, é hardcoded em `APAC_ACS` mesmo. Todos já modelados em `src/lib/apac.ts` como `const object` + union type (`erasableSyntaxOnly` proíbe `enum`). `procedure` voltou a ser um enum — a API garante isso com um enum interno, agora um catálogo grande (~47 procedimentos) em vez dos antigos `EXAME`/`CIRURGIA`. Lista em `APAC_PROCEDURE_LIST`/`ApacProcedure` em `src/lib/apac.ts`, hardcoded (não deriva de endpoint, mesmo caso de `APAC_ACS`). Grande demais para `Select`: nos formulários (`ApacFormRequestStep`, `ApacEditDialog`) é um `Combobox` com busca (`src/components/ui/combobox.tsx`), não um `Input` nem `Select`.
- **Edição e exclusão de APAC**: `PATCH /apacs/:id` (`name`/`acs`/`procedure`/`municipality`/`status`, todos opcionais — envie só o que mudou; é por aqui que a transição de status acontece, não existe endpoint dedicado) e `DELETE /apacs/:id` (204, sem 404 — id inexistente cai em 500). `cns`, `priority`, `birth_date` e `cpf` não são editáveis por esse endpoint. Implementado em `updateApac`/`deleteApac` (`src/api/apacs.ts`), `useUpdateApac`/`useDeleteApac` (`src/hooks/use-apacs.ts`), `ApacEditDialog`/`ApacDeleteAlert` (`src/components/apacs/`).
- **Endpoints ainda não implementados no backend** (busca por id): não construa telas que dependam disso sem confirmar com o usuário. O mock responde a algumas rotas que a API real não tem — não assuma que funcionar contra o mock prova que funciona contra o backend.
- **Anexo de PDF**: `POST /apacs` devolve `{ apac, uploadUrl }` — o backend não recebe o arquivo. O front faz um `PUT` **direto** para `uploadUrl` (presigned do Cloudflare R2, válida por 15 min) com o binário do PDF, sem `Authorization` e sem passar por `request()`/`src/api/client.ts`. Ver `uploadApacPdf` em `src/api/apacs.ts`. Se o `PUT` falhar, a APAC **já foi criada** — não repita o `POST` (duplicaria o registro); não existe endpoint pra regerar a `uploadUrl` isoladamente, então o único fallback hoje é reenviar pra mesma URL enquanto ela não tiver expirado. O `PUT` sai direto do navegador pro bucket, então precisa de CORS Policy configurada **no R2** (não na API) — sem isso o preflight falha com `blocked by CORS policy`, que no client aparece como o mesmo erro genérico de falha de rede (não dá pra distinguir os dois).
- **Visualizar PDF**: `GET /apacs` devolve `pdf_url` em cada item (presigned de download, válida por 1h, gerada a cada chamada — vem preenchida mesmo que nenhum PDF tenha sido enviado ainda). `ApacsTableCard` e `ApacDetailsDialog` abrem `apac.pdfUrl` em nova aba (`target="_blank"`) quando presente; o navegador já renderiza/baixa/imprime o PDF nativamente, então **não** construa viewer, download ou impressão próprios pra isso.
- **Campos fora do contrato** (nº da APAC, SIGTAP, CID, médico, unidade): não os adicione a um formulário que faz `POST`. Coletar dado que a API descarta em silêncio é pior que não coletar.

### Dados sensíveis

- CPF e CNS são dados pessoais de saúde. **Nunca** logue-os em `console`, não persista em `localStorage`, e não os inclua em query strings ou URLs.
- `GET /apacs`, `POST /apacs` e `PATCH /apacs/:id` devolvem `cns`/`cpf` em **texto puro** (não são mais criptografados). Fazem parte do view model `Apac` e aparecem no `ApacDetailsDialog` (exibição sob demanda, ao abrir o detalhe de uma APAC) — mas continuam dado pessoal de saúde: não devem ir para a tabela, a busca da listagem, log, `localStorage` ou query string. O `PATCH` de edição não os altera.
- **Nunca exiba nem logue `ApiError.details`** — o `500` de `POST /apacs` pode devolver os dados do paciente. Nas telas, use só `error.message`, que já é normalizado.
- O token JWT vive em `sessionStorage` (decisão registrada em [.docs/integracao-api.md](.docs/integracao-api.md)); logout limpa o storage e o cache do React Query. As claims expostas pelo `useSession()` omitem o `cpf` presente no payload do JWT.
- Nunca commite `.env` com valores reais. `.env.example` é versionado; `.env*` está no `.gitignore`.

## Diretrizes de Pull Request

- Formato do título: `tipo: descrição curta` (convenção do histórico: `chore: setup webapp`, `feat:`, `fix:`, `refactor:`, `docs:`).
- Antes de commitar, rode e deixe verde: `pnpm typecheck`, `pnpm lint`, `pnpm format`.
- Commits em português, imperativo, escopo pequeno.
- Não commite `dist/`, `node_modules/` nem `.env`.
- `.agents/` e `skills-lock.json` são gerenciados pela CLI de skills — não edite manualmente.

## Notas e armadilhas comuns

- **Porta 3001**, não 3000 — 3000 é da API (real ou `pnpm api:mock`).
- **`DropdownMenuLabel`/`SelectLabel` são `GroupLabel` do Base UI**: fora de um `Group`/`RadioGroup` eles **lançam em runtime**, não degradam. Todo label precisa viver dentro do grupo que nomeia.
- **`SelectValue` renderiza o valor cru**, não o texto do item. Quando `value` difere do label (enums, sentinelas), passe uma função como `children`.
- **`SidebarInset` não tem `min-w-0`**: sem isso, uma tabela larga empurra a página inteira para o scroll horizontal. O mesmo vale para filhos de grid/flex (`*:min-w-0`).
- **Tailwind v4 sem config file**: toda customização de tema vive em `src/index.css` (`@theme inline`, `:root`, `.dark`). Não crie `tailwind.config.js`.
- **Base UI ≠ Radix**: props diferem (`render` vs `asChild`). Existe a skill `migrate-radix-to-base` em `.agents/skills/` se precisar converter código de exemplo.
- **Tema**: `ThemeProvider` alterna com a tecla `d` (ignorada em campos editáveis) e sincroniza entre abas via evento `storage`. Ao adicionar inputs custom, garanta que o alvo seja detectado como editável.
- `mockups/dashboard-apacs.html` é referência visual estática do dashboard — use como guia de layout, não como código a ser portado literalmente.
- `pnpm-workspace.yaml` existe com `packages: []` — **não é um monorepo**; serve apenas para o campo `allowBuilds`.
- O **mock (`mock/`) é mais permissivo que a API real**: responde a rotas apenas previstas (`GET/PATCH/DELETE` por id) e aceita query params do json-server. Funcionar contra o mock não prova que funciona contra o backend — confira o contrato.
