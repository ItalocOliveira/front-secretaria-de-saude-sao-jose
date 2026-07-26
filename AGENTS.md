# AGENTS.md

Guia para agentes de código que trabalham neste repositório. Escrito em pt-BR (idioma do produto e da documentação); comandos, nomes de arquivos e termos técnicos permanecem em inglês.

## Visão geral do projeto

Frontend (SPA) da **Secretaria de Saúde de São José dos Ramos**. A aplicação consome a API descrita em [.docs/api-backend.md](.docs/api-backend.md) e gerencia dois domínios:

- **Usuários** — cadastro/listagem de contas do sistema (`/users`).
- **APACs** — Autorização de Procedimento Ambulatorial de Alta Complexidade (`/apecs`).

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
| Package manager  | **pnpm**                                                                 |

**Ainda não definidos** (não assuma que existem; pergunte antes de introduzir): roteador, biblioteca de data fetching (SWR/TanStack Query), gerenciador de formulários, framework de testes, camada de API/client HTTP.

### Estrutura de diretórios

```
src/
  main.tsx                    # entry: StrictMode > ThemeProvider > TooltipProvider > App + Toaster
  App.tsx                     # raiz da aplicação (atualmente placeholder do scaffold)
  index.css                   # Tailwind v4 + tokens shadcn (@theme inline, :root, .dark)
  components/
    theme-provider.tsx        # tema light/dark/system, persistido em localStorage, atalho "d"
    ui/                       # componentes shadcn/ui — gerados pela CLI, ver regras abaixo
  hooks/
    use-mobile.ts             # useIsMobile() — breakpoint 768px
  lib/
    utils.ts                  # cn() = twMerge(clsx(...))
  assets/
mockups/                      # protótipos HTML estáticos de referência visual (dashboard-apacs.html)
public/
.docs/
  api-backend.md              # contrato da API backend (serviço externo) — referência de integração
.agents/skills/               # skills instaladas (shadcn, migrate-radix-to-base) — não editar à mão
README.md                     # documentação humana deste frontend
```

Documentação complementar (contratos, decisões, referências) vai em `.docs/`. Mantenha o `README.md` da raiz enxuto: stack, como rodar, scripts e links.

## Comandos de setup

```bash
pnpm install          # instala dependências (use pnpm; o lockfile é pnpm-lock.yaml)
pnpm dev              # dev server em http://localhost:3001 (HMR)
pnpm build            # tsc -b && vite build  → dist/
pnpm preview          # serve o build de produção
```

Node: use uma versão compatível com Vite 8 (Node 20.19+ / 22.12+). Não há `.env` versionado; a base URL da API (`http://localhost:3000` em dev) deve ser lida de `import.meta.env.VITE_*` quando a camada de API for criada — nunca hardcoded em componentes.

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

Contrato completo em [.docs/api-backend.md](.docs/api-backend.md). Pontos que o frontend precisa respeitar:

- **Base URL**: `http://localhost:3000` em dev → exponha via `VITE_API_URL`.
- **Auth**: `POST /auth/login` com `{ cpf, password }` → `{ token }`. Token expira em **1h**; trate `401` (não autenticado) redirecionando ao login e `403` (role insuficiente) com mensagem de acesso negado. Não há refresh token implementado.
- **Roles**: `DEV`, `DIRETOR`, `SECRETARIA`, `RECEPCIONISTA`, `REGULADOR`. A UI deve esconder/desabilitar ações conforme a matriz de permissões documentada em `.docs/api-backend.md` (ex.: `SECRETARIA` não acessa APACs; `RECEPCIONISTA`/`REGULADOR` não acessam usuários).
- **Enums de APAC**: `procedure` = `EXAME` | `CIRURGIA`; `priority` = `URGENTE` | `NORMAL`; `status` = `PENDENTE` → `AGUARDO` → `APROVADO` | `CANCELADO` | `NEGADO`. `status` **não** é enviado na criação.
- Modele esses enums como union types + `const` object (lembre: `erasableSyntaxOnly` proíbe `enum`).
- **Endpoints ainda não implementados no backend** (edição, exclusão, busca por id, anexo de PDF): não construa telas que dependam deles sem confirmar com o usuário.

### Dados sensíveis

- CPF e CNS são dados pessoais de saúde. **Nunca** logue-os em `console`, não persista em `localStorage`, e não os inclua em query strings ou URLs.
- O token JWT é a única credencial no cliente; ao armazená-lo, documente a escolha (memória vs `localStorage`) e trate logout limpando o storage.
- Nunca commite `.env` com valores reais.

## Diretrizes de Pull Request

- Formato do título: `tipo: descrição curta` (convenção do histórico: `chore: setup webapp`, `feat:`, `fix:`, `refactor:`, `docs:`).
- Antes de commitar, rode e deixe verde: `pnpm typecheck`, `pnpm lint`, `pnpm format`.
- Commits em português, imperativo, escopo pequeno.
- Não commite `dist/`, `node_modules/` nem `.env`.
- `.agents/` e `skills-lock.json` são gerenciados pela CLI de skills — não edite manualmente.

## Notas e armadilhas comuns

- **Porta 3001**, não 3000 — 3000 é da API backend.
- **Tailwind v4 sem config file**: toda customização de tema vive em `src/index.css` (`@theme inline`, `:root`, `.dark`). Não crie `tailwind.config.js`.
- **Base UI ≠ Radix**: props diferem (`render` vs `asChild`). Existe a skill `migrate-radix-to-base` em `.agents/skills/` se precisar converter código de exemplo.
- **Tema**: `ThemeProvider` alterna com a tecla `d` (ignorada em campos editáveis) e sincroniza entre abas via evento `storage`. Ao adicionar inputs custom, garanta que o alvo seja detectado como editável.
- `mockups/dashboard-apacs.html` é referência visual estática do dashboard — use como guia de layout, não como código a ser portado literalmente.
- `pnpm-workspace.yaml` existe com `packages: []` — **não é um monorepo**; serve apenas para o campo `allowBuilds`.
- `src/App.tsx` ainda é o placeholder do scaffold shadcn; substituir é esperado, não é regressão.
