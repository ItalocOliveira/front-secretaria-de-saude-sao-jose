# API mockada

Mock da API descrita em [`.docs/api-backend.md`](../.docs/api-backend.md), para testar chamadas do front sem depender do backend.

```bash
pnpm api:mock              # http://localhost:3000
pnpm api:mock --port 4000  # outra porta (ou PORT=4000)
pnpm api:mock --reset      # descarta os dados e recomeça do seed
```

## Arquivos

| Arquivo        |                                                      |
| -------------- | ---------------------------------------------------- |
| `server.mjs`   | JWT, roles e validações por cima do json-server      |
| `db.seed.json` | dados iniciais, versionados                          |
| `db.json`      | banco em uso — gitignored, recriado a partir do seed |

Escritas (`POST`, `PATCH`, `PUT`, `DELETE`) persistem em `db.json` e sobrevivem a reinicializações. Para voltar ao estado inicial, `pnpm api:mock --reset`.

## Credenciais

Uma conta por role, para exercitar a matriz de permissões:

| Role            | CPF           | Senha           |
| --------------- | ------------- | --------------- |
| `DEV`           | `11111111111` | `dev123`        |
| `DIRETOR`       | `22222222222` | `diretor123`    |
| `SECRETARIA`    | `33333333333` | `secretaria123` |
| `RECEPCIONISTA` | `44444444444` | `recepcao123`   |
| `REGULADOR`     | `55555555555` | `regulador123`  |

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"cpf":"11111111111","password":"dev123"}' | jq -r .token)

curl http://localhost:3000/apacs -H "Authorization: Bearer $TOKEN"
```

O token é um JWT HS256 real: a assinatura é verificada, o `exp` é de 1 hora e o payload (`{ id, cpf, role, iat, exp }`) pode ser decodificado no front. Token ausente, mal formatado, adulterado ou expirado devolve os mesmos `401` da doc; role insuficiente devolve `403`.

## Endpoints

Iguais aos da doc — mesmos códigos de status, mesmas mensagens de erro, mesma matriz de roles. `GET /` lista todas as rotas.

Além do que a doc marca como implementado, o mock também responde a rotas ainda **previstas** no backend, para você poder construir a tela antes da API existir:

- `GET /users/:id`, `GET /apacs/:id`
- `PATCH`, `PUT`, `DELETE` em `/users/:id` e `/apacs/:id`

Elas usam as mesmas roles da coleção. Atenção: `PATCH /apacs/:id` aceita qualquer `status` — a transição `PENDENTE → AGUARDO → APROVADO | CANCELADO | NEGADO` **não** é validada aqui.

### Query params

As listagens são servidas pelo json-server, então aceitam filtro, ordenação e paginação:

```
GET /apacs?status=PENDENTE
GET /apacs?procedure=CONSULTA_EM_PEDIATRIA&priority=URGENTE
GET /apacs?_sort=-created_at
GET /apacs?_page=1&_per_page=10
```

Com `_page`, a resposta vem envelopada em `{ first, prev, next, last, pages, items, data }`.

> `pdf_url` (ver seção abaixo) só aparece em `GET /apacs` e `GET /apacs/:id` **sem** query params — com filtro/ordenação/paginação a resposta vem do json-server puro, sem o campo injetado. Suficiente pra testar a tela, mas não é 100% fiel à API real nesse ponto.

### Upload e download de PDF

`POST /apacs` devolve `{ apac, uploadUrl }`. `uploadUrl` aponta pra um endpoint local (`PUT /mock-uploads/:id.pdf?exp=...`) que imita a presigned URL de upload do Cloudflare R2 da API real: sem `Authorization`, validade de 15 min (`exp` embutido na própria URL, não em token). Depois do `exp`, o `PUT` devolve `403`, igual a um link do R2 vencido. Os arquivos "enviados" ficam em `mock/uploads/` (gitignored).

`GET /apacs` devolve um `pdf_url` em cada item — `GET /mock-uploads/:id.pdf?exp=...`, mesma lógica de validade (1h) e mesmo `403` se expirado. Se o PDF ainda não foi enviado (nenhum arquivo em `mock/uploads/` com esse id), devolve `404`, igual a um objeto inexistente no R2.

## Limites

Só para desenvolvimento local:

- o segredo do JWT está no código;
- `cpf_hash`/`cns_hash` são SHA-256 simples (o backend usa Argon2 para senha) e `*_encrypted` é base64 reversível, de propósito, para facilitar o debug;
- as senhas ficam em texto plano em `db.json`, na coleção interna `_credentials` — o roteador nunca a expõe, mas não coloque nada real ali;
- CORS liberado para qualquer origem.
