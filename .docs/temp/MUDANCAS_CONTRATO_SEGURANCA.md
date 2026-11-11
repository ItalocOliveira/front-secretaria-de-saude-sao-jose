# Mudanças de contrato da API — segurança, paginação e multi-tenant

Documento para o frontend (`front-secretaria-de-saude-sao-jose`). Lista tudo o que mudou no
comportamento visível da API (branch `multi-tenant`). O que não está aqui continua igual.

**Resumo do que o front precisa mudar (obrigatório):**

1. As quatro listagens (`GET /apacs`, `/documents`, `/itens`, `/users`) agora devolvem
   `{ data, pagination }` em vez de um array, e trazem no máximo 100 registros por página.
2. A busca e o filtro por status dessas listas passam a ser feitos pela API (query string).
3. Tratar os novos status de erro: `429`, `413`, `409`, e os `404` que antes eram `500`.

---

## 1. Listagens paginadas (BREAKING)

Valem para `GET /apacs`, `GET /documents`, `GET /itens` e `GET /users`.

### Query string

| Parâmetro  | Tipo    | Padrão | Regras                                   | Descrição                                                           |
| ---------- | ------- | ------ | ---------------------------------------- | ------------------------------------------------------------------- |
| `page`     | inteiro | `1`    | `>= 1`                                   | Página (começa em 1).                                               |
| `pageSize` | inteiro | `50`   | `1` a `100`                              | Registros por página.                                               |
| `search`   | string  | —      | até 100 caracteres                       | Filtra por **nome**, contém, sem diferenciar maiúsculas/minúsculas. |
| `status`   | string  | —      | valor do enum do recurso (tabela abaixo) | Filtra por status exato.                                            |

Valores aceitos em `status`:

| Rota             | Campo filtrado | Valores                                                                     |
| ---------------- | -------------- | --------------------------------------------------------------------------- |
| `GET /apacs`     | `status`       | `PENDENTE`, `AGUARDO`, `APROVADO`, `CANCELADO`, `NEGADO`, `ENTREGUE`        |
| `GET /documents` | `status`       | `ATENDIDO`, `SOLICITADO`, `NEGADO`, `FINALIZADO`                            |
| `GET /itens`     | `status`       | `DISPONIVEL`, `EMPRESTADO`                                                  |
| `GET /users`     | **`role`**     | `DEV`, `SECRETARIO`, `DIRETOR`, `RECEPCIONISTA`, `REGULADOR`, `COORDENADOR` |

Parâmetro fora das regras (ex.: `pageSize=500`, `page=0`, `status=XYZ`) → `400`.

### Ordenação

- APACs, documentos e itens: **mais recentes primeiro** (`created_at` decrescente).
- Usuários: **nome em ordem alfabética**.

### Resposta

Antes:

```json
[{ "id": "...", "name": "MARIA" }, ...]
```

Agora:

```json
{
  "data": [{ "id": "...", "name": "MARIA", "pdf_url": "https://..." }],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "total": 132,
    "totalPages": 3
  }
}
```

- Cada item de `data` tem **exatamente o mesmo formato** que os itens do array antigo
  (inclusive `pdf_url` em APACs/documentos e `image_url` em itens/movimentações).
- `total` é a contagem com os mesmos filtros (`search`/`status`) aplicados.
- Página além da última → `data: []` com `total` correto (não é erro).

### Exemplos

```
GET /apacs                                   → página 1, 50 APACs mais recentes
GET /apacs?page=2&pageSize=20                → APACs 21 a 40
GET /apacs?search=maria&status=PENDENTE      → APACs pendentes com "maria" no nome
GET /users?status=RECEPCIONISTA              → só recepcionistas
```

### O que adaptar no front

- Trocar `response.data` (array) por `response.data.data` e ler `response.data.pagination`
  (o nome depende do cliente HTTP; com `fetch` é `json.data` / `json.pagination`).
- **Busca e filtros que hoje são feitos no array em memória precisam ir para a query
  string**, porque o front deixa de receber todos os registros. Isso inclui a tela da
  recepcionista que lista APACs para escolher qual editar: use `search` com debounce.
- Adicionar controle de paginação (ou "carregar mais") nas tabelas.
- Telas que precisam de **todos** os registros (ex.: um select com todos os itens do
  almoxarifado) devem buscar página a página até `page === totalPages`, ou usar `search`.
- As contagens de dashboard devem continuar vindo de `POST /reports/apacs`, e não do
  tamanho da lista.
- A busca de APAC é **só por nome**. CPF/CNS não são pesquisáveis (ficam criptografados).

---

## 2. Formato dos erros

Há dois formatos de corpo de erro. Para exibir a mensagem, use
**`body.message ?? body.error`**.

| Origem                                                                 | Formato                                                               |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Regra de negócio dos controllers (CPF inválido, item sem estoque etc.) | `{ "error": "Mensagem em português" }`                                |
| Validação de schema, rate limit, body grande, erro interno, login      | `{ "statusCode": 400, "error": "Bad Request", "message": "Detalhe" }` |

**Erros `500` não trazem mais detalhes internos.** Antes, várias rotas devolviam o erro do
Prisma inteiro (campos `details`, `code`, `meta`, `clientVersion` e trechos da query). Agora:

```json
{ "statusCode": 500, "error": "Internal Server Error", "message": "Erro interno do servidor." }
```

ou, nas rotas de APAC/documentos/relatório, `{ "error": "Erro ao criar Apac" }` (sem
`details`). Se o front lia `details` para alguma coisa, deixe de ler.

---

## 3. Novos status HTTP por rota

### Todas as rotas

| Status | Quando                                                                | Corpo                                                                                                             |
| ------ | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `429`  | Mais de **300 requisições por minuto** do mesmo IP.                   | `{ statusCode: 429, error: "Too Many Requests", message: "Muitas requisições. Tente novamente em 42 segundos." }` |
| `413`  | Body JSON maior que **100 KB**.                                       | `{ statusCode: 413, error: "Payload Too Large", message: "Request body is too large" }`                           |
| `400`  | Campo com tipo errado ou tamanho acima do limite (tabela da seção 5). | `{ statusCode: 400, error: "Bad Request", message: "body/name must be string" }`                                  |

O `429` vem com o header `Retry-After` (segundos). Sugestão: mostrar a mensagem e não fazer
retry automático em loop.

As mensagens de validação de schema (`400`) vêm **em inglês**, geradas pelo validador
(ex.: `body/password must NOT have more than 128 characters`). O ideal é o front já impedir
esses casos no formulário (limites na seção 5).

### `POST /auth/login`

| Status | Antes                                   | Agora                                                                                                                                          |
| ------ | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `401`  | Qualquer erro, inclusive falha de banco | **Só** credencial errada: `message: "Credenciais inválidas."`                                                                                  |
| `500`  | —                                       | Falha interna (banco fora etc.): `message: "Erro interno do servidor."`                                                                        |
| `429`  | —                                       | Mais de **10 tentativas por minuto** do mesmo IP (`message: "Muitas requisições. ..."`)                                                        |
| `429`  | —                                       | Mais de **5 tentativas em 15 minutos** para o mesmo CPF: `message: "Muitas tentativas de login para este CPF. Tente novamente em 15 minutos."` |
| `400`  | `500` quando o body vinha vazio         | Body sem `cpf`/`password`, ou senha com mais de 128 caracteres                                                                                 |

O login com CPF inexistente agora demora o mesmo que com CPF existente (~100 ms a mais).

### `POST /users`

| Status | Quando                                                                             | Corpo                                                               |
| ------ | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `403`  | O cargo de quem cria não pode criar o cargo pedido. **Hoje: só `DEV` cria `DEV`.** | `{ "error": "Seu cargo não pode criar usuários com o cargo DEV." }` |
| `409`  | Já existe usuário com o CPF (antes era `500`).                                     | `{ "error": "Já existe um usuário com este CPF." }`                 |

Sugestão: na tela de cadastro, esconder a opção `DEV` para quem não é `DEV`.

### `PATCH`/`DELETE` em `/apacs/:id`, `/documents/:id` e `/itens/:id`

| Status | Antes | Agora                                                                                                                                      |
| ------ | ----- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `404`  | `500` | Id inexistente **ou de outro município**: `{ "error": "APAC não encontrada." }` / `"Documento não encontrado."` / `"Item não encontrado."` |

(`DELETE /documents/:id` já respondia `404`; agora as outras também.)

### `/itens`

| Rota                        | Mensagem                                                                                 | Antes                    | Agora               |
| --------------------------- | ---------------------------------------------------------------------------------------- | ------------------------ | ------------------- |
| `POST /itens/:id/movements` | `"Estoque insuficiente para esta saída."`                                                | `500` (Error do Fastify) | `400`               |
| `POST /itens/:id/movements` | `"Item não encontrado."`                                                                 | `500`                    | `404`               |
| `DELETE /itens/:id`         | `"Não é possível excluir um item que já possui movimentações registradas no histórico."` | `400`                    | `400` (sem mudança) |

Todas no formato `{ "error": "..." }`.

### `POST /reports/apacs`

| Status | Quando                                         | Corpo                                                                    |
| ------ | ---------------------------------------------- | ------------------------------------------------------------------------ |
| `400`  | Período personalizado com mais de **366 dias** | `{ "error": "O período do relatório não pode passar de 366 dias." }`     |
| `400`  | `startDate` depois de `endDate`                | `{ "error": "\"startDate\" deve ser anterior ou igual a \"endDate\"." }` |

Sugestão: limitar o seletor de datas a um ano.

---

## 4. Isolamento por município (multi-tenant)

Toda leitura, edição, exclusão e relatório agora considera **só os dados do município do
usuário logado** (vem do token). Com um único município cadastrado hoje, nada muda na
prática. Um id de outro município se comporta como inexistente (`404`).

---

## 5. Limites de tamanho dos campos

Campos opcionais aceitam `null`.

| Rota                        | Campo                                                      | Limite                          |
| --------------------------- | ---------------------------------------------------------- | ------------------------------- |
| `POST /auth/login`          | `cpf`                                                      | obrigatório, até 32 caracteres  |
|                             | `password`                                                 | obrigatório, 1 a 128 caracteres |
| `POST /users`               | `name`                                                     | obrigatório, até 200            |
|                             | `password`                                                 | obrigatório, 1 a 128            |
|                             | `cpf`, `role`                                              | obrigatórios                    |
| `POST /apacs`               | `name`                                                     | obrigatório, até 200            |
|                             | `cns`, `procedure`, `acs`, `priority`                      | obrigatórios                    |
|                             | `municipality`                                             | até 200                         |
|                             | `birth_date`                                               | string (ISO 8601), até 64       |
| `PATCH /apacs/:id`          | `name`, `municipality`                                     | até 200                         |
| `POST /documents`           | `name`                                                     | obrigatório, até 200            |
|                             | `destination`                                              | obrigatório                     |
|                             | `note`                                                     | até 2000                        |
|                             | `other_destination`                                        | até 200                         |
| `PATCH /documents/:id`      | `name` / `note`                                            | até 200 / até 2000              |
| `POST /itens`               | `name`, `type`                                             | obrigatórios; `name` até 200    |
|                             | `description`                                              | até 2000                        |
|                             | `amount`                                                   | número                          |
| `PATCH /itens/:id`          | `name` / `description`                                     | até 200 / até 2000              |
| `POST /itens/:id/movements` | `movementType`, `amount` (número), `destination` (até 200) | obrigatórios                    |
| `POST /reports/apacs`       | `startDate`, `endDate`                                     | até 64; `interval` até 10       |

CPF (11 dígitos) e CNS (15 dígitos) continuam validados pela API com as mensagens de antes
(`"CPF deve conter exatamente 11 dígitos."`).

---

## 6. Sem mudança para o front

- Autenticação continua por `Authorization: Bearer <token>`; os tokens atuais continuam
  válidos.
- Formato de `POST /apacs` (`{ apac, uploadUrl }`), `POST /documents`
  (`{ document, uploadUrl }`), `POST /itens` e do relatório: iguais.
- Upload/download dos arquivos no R2 pelas presigned URLs: igual.
