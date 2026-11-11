# Permissões por cargo

O que cada cargo pode acessar na API. Quem decide de verdade são as listas de cargos nos controllers em `src/controllers/`. Se uma lista mudar, atualize este arquivo.

## Cargos

| Cargo         | Valor no enum `Roles` |
| ------------- | --------------------- |
| Desenvolvedor | `DEV`                 |
| Secretário    | `SECRETARIO`          |
| Diretor       | `DIRETOR`             |
| Recepcionista | `RECEPCIONISTA`       |
| Regulador     | `REGULADOR`           |
| Coordenador   | `COORDENADOR`         |

## Resumo

`DEV`, `DIRETOR`, `SECRETARIO`, `REGULADOR` e `COORDENADOR` acessam **todos os endpoints**.

`RECEPCIONISTA` é o único cargo com acesso parcial, e só nestas rotas:

- `POST /documents`: criar ofício
- `POST /apacs`: criar APAC
- `GET /apacs`: listar APACs (para escolher qual editar)
- `PATCH /apacs/:id`: editar APAC
- `POST /reports/apacs`: gerar relatório

Em todo o resto (usuários, excluir APAC, listar/editar/excluir ofícios, almoxarifado e `/auth/admin`) a API responde `403` para ele.

✅ = tem acesso. — = sem acesso (a API responde `403`).

| Rota                                | DEV | DIRETOR | SECRETARIO | REGULADOR | COORDENADOR | RECEPCIONISTA |
| ----------------------------------- | :-: | :-----: | :--------: | :-------: | :---------: | :-----------: |
| `POST /apacs`, `GET /apacs`         | ✅  |   ✅    |     ✅     |    ✅     |     ✅      |      ✅       |
| `PATCH /apacs/:id`                  | ✅  |   ✅    |     ✅     |    ✅     |     ✅      |      ✅       |
| `DELETE /apacs/:id`                 | ✅  |   ✅    |     ✅     |    ✅     |     ✅      |       —       |
| `POST /reports/apacs`               | ✅  |   ✅    |     ✅     |    ✅     |     ✅      |      ✅       |
| Usuários (`/users`)                 | ✅  |   ✅    |     ✅     |    ✅     |     ✅      |       —       |
| Almoxarifado (`/itens`)             | ✅  |   ✅    |     ✅     |    ✅     |     ✅      |       —       |
| `POST /documents`                   | ✅  |   ✅    |     ✅     |    ✅     |     ✅      |      ✅       |
| `GET`, `PATCH`, `DELETE /documents` | ✅  |   ✅    |     ✅     |    ✅     |     ✅      |       —       |
| Área admin de teste (`/auth/admin`) | ✅  |   ✅    |     ✅     |    ✅     |     ✅      |       —       |

`POST /auth/login` é público. Para `GET /auth/me`, basta estar logado, com qualquer cargo. A permissão é decidida pelo `role` que vem no `/auth/me`; login, token e formato das respostas não mudaram.

## Rotas

### APACs

| Método   | Rota         | O que faz                 | Quem pode                     |
| -------- | ------------ | ------------------------- | ----------------------------- |
| `POST`   | `/apacs`     | Cria APAC (com PDF)       | Todos os cargos               |
| `GET`    | `/apacs`     | Lista APACs               | Todos os cargos               |
| `PATCH`  | `/apacs/:id` | Edita APAC                | Todos os cargos               |
| `DELETE` | `/apacs/:id` | Exclui APAC e o PDF no R2 | Todos, exceto `RECEPCIONISTA` |

### Relatório de APACs: todos os cargos

| Método | Rota             | O que faz                                   |
| ------ | ---------------- | ------------------------------------------- |
| `POST` | `/reports/apacs` | Gera o relatório (ver `RELATORIO_APACS.md`) |

### Usuários: todos, exceto `RECEPCIONISTA`

| Método | Rota     | O que faz      |
| ------ | -------- | -------------- |
| `POST` | `/users` | Cria usuário   |
| `GET`  | `/users` | Lista usuários |

Ainda não existe rota para excluir usuário.

### Almoxarifado: todos, exceto `RECEPCIONISTA`

| Método   | Rota                   | O que faz                                                         |
| -------- | ---------------------- | ----------------------------------------------------------------- |
| `POST`   | `/itens`               | Cria item (com imagem)                                            |
| `GET`    | `/itens`               | Lista itens                                                       |
| `PATCH`  | `/itens/:id`           | Edita item                                                        |
| `DELETE` | `/itens/:id`           | Exclui item e imagem. Responde `400` se o item já tiver histórico |
| `POST`   | `/itens/:id/movements` | Registra entrada ou saída                                         |

### Documentos (ofícios)

| Método   | Rota             | O que faz                                                   | Quem pode                     |
| -------- | ---------------- | ----------------------------------------------------------- | ----------------------------- |
| `POST`   | `/documents`     | Cria documento (com PDF)                                    | Todos os cargos               |
| `GET`    | `/documents`     | Lista documentos                                            | Todos, exceto `RECEPCIONISTA` |
| `PATCH`  | `/documents/:id` | Edita documento                                             | Todos, exceto `RECEPCIONISTA` |
| `DELETE` | `/documents/:id` | Exclui documento e o PDF no R2 (ver `EXCLUIR_DOCUMENTO.md`) | Todos, exceto `RECEPCIONISTA` |

### Autenticação

| Método | Rota          | Quem pode                                     |
| ------ | ------------- | --------------------------------------------- |
| `POST` | `/auth/login` | Público                                       |
| `GET`  | `/auth/me`    | Qualquer usuário logado                       |
| `GET`  | `/auth/admin` | Todos, exceto `RECEPCIONISTA` (rota de teste) |

## Erros de acesso

| Status | Quando                                               | Corpo                                                        |
| ------ | ---------------------------------------------------- | ------------------------------------------------------------ |
| `401`  | Sem token, token mal formatado, inválido ou expirado | `{ "message": "..." }`                                       |
| `403`  | Usuário logado, mas o cargo não tem acesso à rota    | `{ "message": "Acesso negado. Privilégios insuficientes." }` |

## Atenção: criação de usuários

Qualquer cargo com acesso a `POST /users` pode criar usuário de **qualquer** cargo, inclusive `DEV`. A API ainda não limita isso.

## Para o frontend

- As listas de permissão do front (`front/src/lib/permissions.ts`) devem seguir esta tabela. Para o `RECEPCIONISTA`: sem menu de usuários e almoxarifado, sem botão de excluir APAC, e a tela de ofícios mostra só o formulário de criação (sem a lista, que daria `403`).
- Esconder um menu ou botão no front não protege nada. Quem bloqueia o acesso é a API, que confere o cargo em toda requisição.
- Trate o `403` mostrando uma mensagem de acesso negado, sem deslogar o usuário. Já o `401` pede um novo login.

## Onde fica no código

| Módulo        | Lista de cargos                                              |
| ------------- | ------------------------------------------------------------ |
| APACs         | `APAC_ROLES` em `src/controllers/apac.controller.ts`         |
| Relatório     | lista na rota, em `src/controllers/report.controller.ts`     |
| Usuários      | `USER_ROLES` em `src/controllers/user.controller.ts`         |
| Almoxarifado  | `ITEM_ROLES` em `src/controllers/item.controller.ts`         |
| Documentos    | `DOCUMENT_ROLES` em `src/controllers/document.controller.ts` |
| `/auth/admin` | lista na rota, em `src/controllers/login.controller.ts`      |

Um cargo novo não ganha acesso a nada sozinho: ele precisa ser incluído em cada lista que deve liberá-lo.
