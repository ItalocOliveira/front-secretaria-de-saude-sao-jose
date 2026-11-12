# 2026-11-13 — `X-Tenant` obrigatório no login (fim do município padrão)

A API não tem mais município padrão. Antes, requisição sem `X-Tenant` caía em São José dos Ramos.

| Rota               | Sem `X-Tenant` (antes) | Sem `X-Tenant` (agora)                        |
| ------------------ | ---------------------- | --------------------------------------------- |
| `POST /auth/login` | login em São José      | `400 { message: "Município não informado." }` |
| `GET /auth/tenant` | `200` com São José     | `400 { message: "Município não informado." }` |
| Rotas autenticadas | município do token     | sem mudança (município do token)              |

O que conferir no front:

- O `www` (landing) não chama a API — nada muda.
- Em desenvolvimento, `localhost:3001` sem município não consegue mais logar. Use
  `<municipio>.<uf>.localhost:3001` (ex.: `saojosedosramos.pb.localhost:3001`) ou `VITE_TENANT_SLUG`.
- Previews da Vercel sem `VITE_TENANT_SLUG` também passam a receber `400` no login.
