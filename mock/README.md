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

curl http://localhost:3000/apecs -H "Authorization: Bearer $TOKEN"
```

O token é um JWT HS256 real: a assinatura é verificada, o `exp` é de 1 hora e o payload (`{ id, cpf, role, iat, exp }`) pode ser decodificado no front. Token ausente, mal formatado, adulterado ou expirado devolve os mesmos `401` da doc; role insuficiente devolve `403`.

## Endpoints

Iguais aos da doc — mesmos códigos de status, mesmas mensagens de erro, mesma matriz de roles. `GET /` lista todas as rotas.

Além do que a doc marca como implementado, o mock também responde a rotas ainda **previstas** no backend, para você poder construir a tela antes da API existir:

- `GET /users/:id`, `GET /apecs/:id`
- `PATCH`, `PUT`, `DELETE` em `/users/:id` e `/apecs/:id`

Elas usam as mesmas roles da coleção. Atenção: `PATCH /apecs/:id` aceita qualquer `status` — a transição `PENDENTE → AGUARDO → APROVADO | CANCELADO | NEGADO` **não** é validada aqui.

### Query params

As listagens são servidas pelo json-server, então aceitam filtro, ordenação e paginação:

```
GET /apecs?status=PENDENTE
GET /apecs?procedure=EXAME&priority=URGENTE
GET /apecs?_sort=-created_at
GET /apecs?_page=1&_per_page=10
```

Com `_page`, a resposta vem envelopada em `{ first, prev, next, last, pages, items, data }`.

## Limites

Só para desenvolvimento local:

- o segredo do JWT está no código;
- `cpf_hash`/`cns_hash` são SHA-256 simples (o backend usa Argon2 para senha) e `*_encrypted` é base64 reversível, de propósito, para facilitar o debug;
- as senhas ficam em texto plano em `db.json`, na coleção interna `_credentials` — o roteador nunca a expõe, mas não coloque nada real ali;
- CORS liberado para qualquer origem.
