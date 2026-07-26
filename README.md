# Secretaria de Saúde de São José dos Ramos — Frontend

Aplicação web (SPA) para gestão de **usuários** e **APACs** (Autorização de Procedimento Ambulatorial de Alta Complexidade) da Secretaria de Saúde de São José dos Ramos.

## Stack

| Camada           | Ferramenta                                                                |
| ---------------- | ------------------------------------------------------------------------- |
| Build/dev server | [Vite](https://vite.dev) 8                                                |
| UI               | [React](https://react.dev) 19                                             |
| Linguagem        | [TypeScript](https://www.typescriptlang.org) 6                            |
| Estilo           | [Tailwind CSS](https://tailwindcss.com) v4                                |
| Componentes      | [shadcn/ui](https://ui.shadcn.com) (style `base-nova`, sobre **Base UI**) |
| Ícones           | [Lucide](https://lucide.dev)                                              |
| Gráficos         | [Recharts](https://recharts.org)                                          |
| Datas            | [date-fns](https://date-fns.org)                                          |
| Lint / Format    | ESLint 10 (flat config) + Prettier 3                                      |
| Package manager  | [pnpm](https://pnpm.io)                                                   |

## Como rodar

```bash
pnpm install
pnpm dev        # http://localhost:3001
```

## Scripts

| Comando          | Descrição                                 |
| ---------------- | ----------------------------------------- |
| `pnpm dev`       | Dev server com HMR na porta `3001`        |
| `pnpm build`     | Type-check + build de produção em `dist/` |
| `pnpm preview`   | Serve localmente o build de produção      |
| `pnpm typecheck` | Verificação de tipos (`tsc --noEmit`)     |
| `pnpm lint`      | ESLint                                    |
| `pnpm format`    | Prettier em `**/*.{ts,tsx}`               |

> Ainda não há testes automatizados configurados neste projeto.

## Estrutura

```
src/
  main.tsx          # entry point (providers de tema, tooltip e toast)
  App.tsx           # raiz da aplicação
  index.css         # Tailwind v4 + tokens de tema do shadcn
  components/ui/    # componentes shadcn/ui
  hooks/            # hooks compartilhados
  lib/utils.ts      # helper cn()
mockups/            # protótipos HTML de referência visual
.docs/              # documentação complementar
```

O alias `@/` aponta para `src/`.

## Backend

Este repositório contém apenas o frontend. A API é um serviço separado, que roda em `http://localhost:3000` durante o desenvolvimento.

📄 **[Documentação da API — endpoints, roles e regras de negócio](.docs/api-backend.md)**

## Contribuindo

Antes de abrir um PR, garanta que `pnpm typecheck`, `pnpm lint` e `pnpm format` passam sem erros.

Convenções de código, padrões de UI e regras detalhadas de contribuição estão em [AGENTS.md](AGENTS.md).
