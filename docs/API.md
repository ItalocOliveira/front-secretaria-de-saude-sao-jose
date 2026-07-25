# Documentação de Endpoints — API Secretaria de Saúde

Base URL: `http://localhost:3000`

## Autenticação

Endpoints protegidos exigem o header:

```http
Authorization: Bearer <token>
```

O token JWT é obtido em `POST /auth/login` e expira em **1 hora**.

---

## Roles disponíveis

| Role | Descrição |
|------|-----------|
| `DEV` | Desenvolvedor — acesso amplo |
| `DIRETOR` | Diretor Geral |
| `SECRETARIA` | Secretária de Saúde |
| `RECEPCIONISTA` | Recepcionista |
| `REGULADOR` | Regulador |

---

## Resumo de permissões

| Endpoint | Método | Autenticação | Roles permitidas |
|----------|--------|--------------|------------------|
| `/auth/login` | POST | Não | Público |
| `/auth/me` | GET | Sim | Qualquer role autenticada |
| `/auth/admin` | GET | Sim | `DEV`, `DIRETOR` |
| `/users` | POST | Sim | `DEV`, `DIRETOR`, `SECRETARIA` |
| `/users` | GET | Sim | `DEV`, `DIRETOR`, `SECRETARIA` |
| `/apecs` | POST | Sim | `DEV`, `DIRETOR`, `RECEPCIONISTA`, `REGULADOR` |
| `/apecs` | GET | Sim | `DEV`, `DIRETOR`, `RECEPCIONISTA`, `REGULADOR` |

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

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `cpf` | `string` | Sim | CPF do usuário |
| `password` | `string` | Sim | Senha do usuário |

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

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `name` | `string` | Sim | Nome completo do usuário |
| `cpf` | `string` | Sim | CPF (deve ser único no banco) |
| `password` | `string` | Sim | Senha em texto plano (será hasheada) |
| `role` | `string` | Sim | Uma das roles: `DEV`, `SECRETARIA`, `DIRETOR`, `RECEPCIONISTA`, `REGULADOR` |

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

## APACs — `/apecs`

### `POST /apecs`

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

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `name` | `string` | Sim | Nome do paciente |
| `cns` | `string` | Sim | Cartão Nacional de Saúde |
| `procedure` | `string` | Sim | Tipo de procedimento: `EXAME` ou `CIRURGIA` |
| `priority` | `string` | Sim | Prioridade: `URGENTE` ou `NORMAL` |
| `birth_date` | `string` (ISO 8601) | Não | Data de nascimento |
| `cpf` | `string` | Não | CPF do paciente |
| `municipality` | `string` | Não | Município |

> O campo `status` **não é aceito na criação** — novas APACs recebem automaticamente o status `PENDENTE`.

**Valores de enum:**

| Enum | Valores |
|------|---------|
| `procedure` | `EXAME`, `CIRURGIA` |
| `priority` | `URGENTE`, `NORMAL` |
| `status` (somente resposta) | `PENDENTE`, `AGUARDO`, `APROVADO`, `CANCELADO`, `NEGADO` |

**Resposta de sucesso (201):**

```json
{
  "name": "João da Silva",
  "cns": "valor-criptografado",
  "procedure": "EXAME",
  "priority": "URGENTE",
  "status": "PENDENTE",
  "birth_date": "1990-05-15T00:00:00.000Z",
  "cpf": "valor-criptografado",
  "municipality": "São José dos Ramos"
}
```

**Resposta de erro (500):**

```json
{
  "error": "Erro ao criar Apec",
  "details": {}
}
```

---

### `GET /apecs`

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
    "municipality": "São José dos Ramos"
  }
]
```

---

## Códigos de erro comuns

| Código | Situação |
|--------|----------|
| `401` | Token ausente, mal formatado, inválido ou expirado |
| `403` | Usuário autenticado, porém sem a role necessária para o endpoint |
| `500` | Erro interno no servidor |

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

| Role | Login | Ver perfil (`/auth/me`) | Admin (`/auth/admin`) | Criar usuário | Listar usuários | Criar APAC | Listar APACs |
|------|:-----:|:-----------------------:|:---------------------:|:-------------:|:---------------:|:----------:|:------------:|
| Público (sem token) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `DEV` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `DIRETOR` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `SECRETARIA` | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| `RECEPCIONISTA` | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `REGULADOR` | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
