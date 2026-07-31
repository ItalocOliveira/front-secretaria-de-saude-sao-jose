# API da Secretária de Saúde de São José dos Ramos

Esta é a documentação de requisitos para a API da Secretária de Saúde. A API gerencia **usuários** e **APACs** (Autorização de Procedimento Ambulatorial de Alta Complexidade), com autenticação JWT e controle de acesso por papéis (`Roles`).

## Funcionalidades

A API expõe três módulos principais:

| Módulo       | Prefixo  | Responsabilidade                                        |
| ------------ | -------- | ------------------------------------------------------- |
| Autenticação | `/auth`  | Login, sessão via JWT e consulta do usuário autenticado |
| Usuários     | `/users` | Cadastro e listagem de contas do sistema                |
| APACs        | `/apacs` | Cadastro e listagem de autorizações de procedimentos    |

Somente usuários autenticados podem operar recursos protegidos. Cada operação exige uma role específica, validada pelo middleware de autorização.

## Requisitos funcionais

### Autenticação e autorização

- [x] Autenticar usuário com `cpf` e `password`, retornando token JWT (`POST /auth/login`)
- [x] Consultar dados do usuário autenticado a partir do token (`GET /auth/me`)
- [x] Proteger endpoints com middleware `authenticate` (header `Authorization: Bearer <token>`)
- [x] Restringir endpoints por role com middleware `authorize`
- [ ] Renovação ou revogação de tokens
- [ ] Recuperação de senha

### Gestão de usuários

Campos do modelo `User` (schema Prisma): `id`, `name`, `cpf_hash`, `cpf_encrypted`, `password_hash`, `role`, `created_at`, `updated_at`.

- [x] Cadastrar usuário com `name`, `cpf`, `password` e `role` (`POST /users`)
- [x] Listar todos os usuários (`GET /users`)
- [ ] Consultar usuário por `id`
- [ ] Atualizar dados de usuário
- [ ] Excluir usuário

### Gestão de APACs

Campos do modelo `Apac` (schema Prisma): `id`, `name`, `birth_date`, `cns_hash`, `cns_encrypted`, `cpf_hash`, `cpf_encrypted`, `status`, `municipality`, `procedure`, `priority`, `created_at`, `updated_at`.

- [x] Cadastrar APAC com dados textuais do paciente e do procedimento (`POST /apacs`)
- [x] Visualizar todas as APACs cadastradas (`GET /apacs`)
- [ ] Consultar APAC por `id`
- [ ] Atualizar/modificar APACs cadastradas (incluindo transição de `status`)
- [ ] Excluir APACs
- [x] Anexar PDFs às APACs (indireto: `POST /apacs` devolve uma presigned URL do Cloudflare R2, o navegador envia o PDF direto pro bucket)

**Campos aceitos na criação** (`ApacCreateDto`):

| Campo          | Obrigatório | Tipo / enum                         |
| -------------- | :---------: | ----------------------------------- |
| `name`         |     Sim     | `string` — nome do paciente         |
| `cns`          |     Sim     | `string` — Cartão Nacional de Saúde |
| `procedure`    |     Sim     | `EXAME` \| `CIRURGIA`               |
| `priority`     |     Sim     | `URGENTE` \| `NORMAL`               |
| `birth_date`   |     Não     | `Date` (ISO 8601)                   |
| `cpf`          |     Não     | `string`                            |
| `municipality` |     Não     | `string`                            |

**Status da APAC** (`Status`, definido no schema — padrão `PENDENTE` na criação):

`PENDENTE` → `AGUARDO` → `APROVADO` | `CANCELADO` | `NEGADO`

> O campo `status` não é informado no cadastro; novas APACs entram sempre como `PENDENTE`.

## Regras de negócio

### Usuários

- Todo usuário deve possuir `name`, `cpf`, `password` e `role`
- O `cpf` é chave única no banco (`cpf_hash` com constraint `@unique`)
- A senha é armazenada como hash (Argon2); o CPF é armazenado com hash e criptografia
- Roles válidas: `DEV`, `SECRETARIA`, `DIRETOR`, `RECEPCIONISTA`, `REGULADOR`

### APACs

- Toda APAC deve possuir `name`, `cns`, `procedure` e `priority`
- `cns` e `cpf` (quando informado) são persistidos com hash e criptografia
- `status` inicia como `PENDENTE` e só pode ser alterado após implementação de endpoint de edição
- `procedure` aceita apenas `EXAME` ou `CIRURGIA`
- `priority` aceita apenas `URGENTE` ou `NORMAL`

### Segurança e acesso

- Endpoints de APACs e usuários exigem autenticação
- Token JWT expira em **1 hora**
- Respostas de acesso negado: `401` (não autenticado) e `403` (role insuficiente)

## Poderes — Roles de usuários

Legenda: **C** = criar · **L** = listar/consultar · **E** = editar · **X** = excluir

### Usuários (`/users`)

| Role            | Criar | Listar | Editar | Excluir |
| --------------- | :---: | :----: | :----: | :-----: |
| `DEV`           |  ✅   |   ✅   |   —    |    —    |
| `DIRETOR`       |  ✅   |   ✅   |   —    |    —    |
| `SECRETARIA`    |  ✅   |   ✅   |   —    |    —    |
| `RECEPCIONISTA` |  ❌   |   ❌   |   —    |    —    |
| `REGULADOR`     |  ❌   |   ❌   |   —    |    —    |

### APACs (`/apacs`)

| Role            | Criar | Listar | Editar | Excluir |
| --------------- | :---: | :----: | :----: | :-----: |
| `DEV`           |  ✅   |   ✅   |   —    |    —    |
| `DIRETOR`       |  ✅   |   ✅   |   —    |    —    |
| `SECRETARIA`    |  ❌   |   ❌   |   —    |    —    |
| `RECEPCIONISTA` |  ✅   |   ✅   |   —    |    —    |
| `REGULADOR`     |  ✅   |   ✅   |   —    |    —    |

> ✅ = implementado · ❌ = sem permissão · — = requisito previsto, ainda não implementado

---

# Documentação dos Endpoints — API

Base URL: `http://localhost:3000`

## Autenticação

Endpoints protegidos exigem o header:

```http
Authorization: Bearer <token>
```

O token JWT é obtido em `POST /auth/login` e expira em **1 hora**.

---

## Roles disponíveis

| Role            | Descrição                    |
| --------------- | ---------------------------- |
| `DEV`           | Desenvolvedor — acesso amplo |
| `DIRETOR`       | Diretor Geral                |
| `SECRETARIA`    | Secretária de Saúde          |
| `RECEPCIONISTA` | Recepcionista                |
| `REGULADOR`     | Regulador                    |

---

## Resumo de permissões

| Endpoint      | Método | Autenticação | Roles permitidas                               |
| ------------- | ------ | ------------ | ---------------------------------------------- |
| `/auth/login` | POST   | Não          | Público                                        |
| `/auth/me`    | GET    | Sim          | Qualquer role autenticada                      |
| `/auth/admin` | GET    | Sim          | `DEV`, `DIRETOR`                               |
| `/users`      | POST   | Sim          | `DEV`, `DIRETOR`, `SECRETARIA`                 |
| `/users`      | GET    | Sim          | `DEV`, `DIRETOR`, `SECRETARIA`                 |
| `/apacs`      | POST   | Sim          | `DEV`, `DIRETOR`, `RECEPCIONISTA`, `REGULADOR` |
| `/apacs`      | GET    | Sim          | `DEV`, `DIRETOR`, `RECEPCIONISTA`, `REGULADOR` |

> **Nota:** `SECRETARIA`, `RECEPCIONISTA` e `REGULADOR` não possuem acesso cruzado entre os módulos de usuários e APACs conforme implementado atualmente.

---

## Auth — `/auth`

### `POST /auth/login`

Autentica um usuário e retorna um token JWT.

**Autenticação:** não requerida (público)

**Request body:**

```json
{
  "cpf": "12345678901",
  "password": "senha123"
}
```

| Campo      | Tipo     | Obrigatório | Descrição        |
| ---------- | -------- | ----------- | ---------------- |
| `cpf`      | `string` | Sim         | CPF do usuário   |
| `password` | `string` | Sim         | Senha do usuário |

**Resposta de sucesso (200):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Resposta de erro (401):**

```json
{
  "message": "Credenciais inválidas."
}
```

---

### `GET /auth/me`

Retorna os dados do usuário autenticado a partir do token JWT.

**Autenticação:** requerida

**Roles permitidas:** qualquer role autenticada (`DEV`, `DIRETOR`, `SECRETARIA`, `RECEPCIONISTA`, `REGULADOR`)

**Request body:** nenhum

**Resposta de sucesso (200):**

```json
{
  "id": "uuid-do-usuario",
  "cpf": "hash-do-cpf",
  "role": "DEV"
}
```

---

### `GET /auth/admin`

Endpoint de teste restrito a roles administrativas.

**Autenticação:** requerida

**Roles permitidas:** `DEV`, `DIRETOR`

**Request body:** nenhum

**Resposta de sucesso (200):**

```json
{
  "message": "Bem-vindo à área SUPREMA, apenas pessoal autorizado pode obter esta mensagem",
  "user": {
    "id": "uuid-do-usuario",
    "cpf": "hash-do-cpf",
    "role": "DIRETOR"
  }
}
```

**Resposta de erro (403):**

```json
{
  "message": "Acesso negado. Privilégios insuficientes."
}
```

---

## Usuários — `/users`

### `POST /users`

Cadastra um novo usuário no sistema.

**Autenticação:** requerida

**Roles permitidas:** `DEV`, `DIRETOR`, `SECRETARIA`

**Request body:**

```json
{
  "name": "Maria Silva",
  "cpf": "12345678901",
  "password": "senhaSegura123",
  "role": "RECEPCIONISTA"
}
```

| Campo      | Tipo     | Obrigatório | Descrição                                                                   |
| ---------- | -------- | ----------- | --------------------------------------------------------------------------- |
| `name`     | `string` | Sim         | Nome completo do usuário                                                    |
| `cpf`      | `string` | Sim         | CPF (deve ser único no banco)                                               |
| `password` | `string` | Sim         | Senha em texto plano (será hasheada)                                        |
| `role`     | `string` | Sim         | Uma das roles: `DEV`, `SECRETARIA`, `DIRETOR`, `RECEPCIONISTA`, `REGULADOR` |

**Resposta de sucesso (200):**

```json
{
  "id": "uuid-gerado",
  "name": "Maria Silva",
  "cpf_encrypted": "valor-criptografado",
  "role": "RECEPCIONISTA"
}
```

---

### `GET /users`

Lista todos os usuários cadastrados.

**Autenticação:** requerida

**Roles permitidas:** `DEV`, `DIRETOR`, `SECRETARIA`

**Request body:** nenhum

**Resposta de sucesso (200):**

```json
[
  {
    "id": "uuid-do-usuario",
    "name": "Maria Silva",
    "cpf_encrypted": "valor-criptografado",
    "role": "RECEPCIONISTA"
  }
]
```

---

## APACs — `/apacs`

### `POST /apacs`

Cadastra uma nova APAC (Autorização de Procedimento Ambulatorial de Alta Complexidade).

**Autenticação:** requerida

**Roles permitidas:** `DEV`, `DIRETOR`, `RECEPCIONISTA`, `REGULADOR`

**Request body:**

```json
{
  "name": "João da Silva",
  "cns": "123456789012345",
  "procedure": "EXAME",
  "priority": "URGENTE",
  "birth_date": "1990-05-15T00:00:00.000Z",
  "cpf": "98765432100",
  "municipality": "São José dos Ramos"
}
```

| Campo          | Tipo                | Obrigatório | Descrição                                   |
| -------------- | ------------------- | ----------- | ------------------------------------------- |
| `name`         | `string`            | Sim         | Nome do paciente                            |
| `cns`          | `string`            | Sim         | Cartão Nacional de Saúde                    |
| `procedure`    | `string`            | Sim         | Tipo de procedimento: `EXAME` ou `CIRURGIA` |
| `priority`     | `string`            | Sim         | Prioridade: `URGENTE` ou `NORMAL`           |
| `birth_date`   | `string` (ISO 8601) | Não         | Data de nascimento                          |
| `cpf`          | `string`            | Não         | CPF do paciente                             |
| `municipality` | `string`            | Não         | Município                                   |

> O campo `status` **não é aceito na criação** — novas APACs recebem automaticamente o status `PENDENTE`.

**Valores de enum:**

| Enum                        | Valores                                                  |
| --------------------------- | -------------------------------------------------------- |
| `procedure`                 | `EXAME`, `CIRURGIA`                                      |
| `priority`                  | `URGENTE`, `NORMAL`                                      |
| `status` (somente resposta) | `PENDENTE`, `AGUARDO`, `APROVADO`, `CANCELADO`, `NEGADO` |

**Resposta de sucesso (201):**

```json
{
  "apac": {
    "name": "João da Silva",
    "cns": "valor-criptografado",
    "procedure": "EXAME",
    "priority": "URGENTE",
    "status": "PENDENTE",
    "birth_date": "1990-05-15T00:00:00.000Z",
    "cpf": "valor-criptografado",
    "municipality": "São José dos Ramos"
  },
  "uploadUrl": "https://<bucket>.r2.cloudflarestorage.com/apacs/<id>.pdf?X-Amz-..."
}
```

> `uploadUrl` é uma **presigned URL** do Cloudflare R2, válida por **15 minutos**. O backend não recebe o PDF: o cliente faz um `PUT` direto para `uploadUrl` com o binário do arquivo, **sem** header `Authorization`. O objeto fica salvo no bucket como `apacs/<id>.pdf`. Não existe endpoint para regerar essa URL isoladamente — se ela expirar antes do `PUT`, o fluxo de anexo precisa ser refeito (a APAC já criada não deve ser recriada).

**Resposta de erro (500):**

```json
{
  "error": "Erro ao criar Apac",
  "details": {}
}
```

---

### `GET /apacs`

Lista todas as APACs cadastradas.

**Autenticação:** requerida

**Roles permitidas:** `DEV`, `DIRETOR`, `RECEPCIONISTA`, `REGULADOR`

**Request body:** nenhum

**Resposta de sucesso (200):**

```json
[
  {
    "name": "João da Silva",
    "cns": "valor-criptografado",
    "procedure": "EXAME",
    "priority": "URGENTE",
    "status": "PENDENTE",
    "birth_date": "1990-05-15T00:00:00.000Z",
    "cpf": "valor-criptografado",
    "municipality": "São José dos Ramos",
    "pdf_url": "https://<bucket>.r2.cloudflarestorage.com/apacs/<id>.pdf?X-Amz-..."
  }
]
```

> `pdf_url` é uma presigned URL de **download**, válida por **1 hora**, gerada a cada chamada. Não está tipada no `ApacDomain` do backend (injetada via spread) — confirmar que o campo realmente vem antes de depender dele no front.

---

## Códigos de erro comuns

| Código | Situação                                                         |
| ------ | ---------------------------------------------------------------- |
| `401`  | Token ausente, mal formatado, inválido ou expirado               |
| `403`  | Usuário autenticado, porém sem a role necessária para o endpoint |
| `500`  | Erro interno no servidor                                         |

**Exemplos de resposta 401:**

```json
{ "message": "Token de autorização não fornecido." }
```

```json
{ "message": "Token mal formatado." }
```

```json
{ "message": "Token inválido ou expirado." }
```

**Exemplo de resposta 403:**

```json
{ "message": "Acesso negado. Privilégios insuficientes." }
```

---

## Matriz de acesso por role

| Role                | Login | Ver perfil (`/auth/me`) | Admin (`/auth/admin`) | Criar usuário | Listar usuários | Criar APAC | Listar APACs |
| ------------------- | :---: | :---------------------: | :-------------------: | :-----------: | :-------------: | :--------: | :----------: |
| Público (sem token) |  ✅   |           ❌            |          ❌           |      ❌       |       ❌        |     ❌     |      ❌      |
| `DEV`               |  ✅   |           ✅            |          ✅           |      ✅       |       ✅        |     ✅     |      ✅      |
| `DIRETOR`           |  ✅   |           ✅            |          ✅           |      ✅       |       ✅        |     ✅     |      ✅      |
| `SECRETARIA`        |  ✅   |           ✅            |          ❌           |      ✅       |       ✅        |     ❌     |      ❌      |
| `RECEPCIONISTA`     |  ✅   |           ✅            |          ❌           |      ❌       |       ❌        |     ✅     |      ✅      |
| `REGULADOR`         |  ✅   |           ✅            |          ❌           |      ❌       |       ❌        |     ✅     |      ✅      |
