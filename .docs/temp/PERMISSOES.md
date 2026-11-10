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

`SECRETARIO`, `REGULADOR` e `COORDENADOR` têm as **mesmas permissões de `DIRETOR`**. Esses quatro cargos e o `DEV` acessam tudo.

`RECEPCIONISTA` é o único cargo com acesso parcial: entra em APACs, no relatório e em usuários, mas não no almoxarifado nem nos documentos.

✅ = tem acesso. — = sem acesso (a API responde `403`).

| Módulo                                | DEV | DIRETOR | SECRETARIO | REGULADOR | COORDENADOR | RECEPCIONISTA |
| ------------------------------------- | :-: | :-----: | :--------: | :-------: | :---------: | :-----------: |
| APACs (`/apacs`)                      | ✅  |   ✅    |     ✅     |    ✅     |     ✅      |      ✅       |
| Relatório de APACs (`/reports/apacs`) | ✅  |   ✅    |     ✅     |    ✅     |     ✅      |      ✅       |
| Usuários (`/users`)                   | ✅  |   ✅    |     ✅     |    ✅     |     ✅      |      ✅       |
| Almoxarifado (`/itens`)               | ✅  |   ✅    |     ✅     |    ✅     |     ✅      |       —       |
| Documentos (`/documents`)             | ✅  |   ✅    |     ✅     |    ✅     |     ✅      |       —       |
| Área admin de teste (`/auth/admin`)   | ✅  |   ✅    |     ✅     |    ✅     |     ✅      |       —       |

`POST /auth/login` é público. Para `GET /auth/me`, basta estar logado, com qualquer cargo.

Cada módulo dá acesso a todas as suas rotas. Não existe cargo que só lista e não pode criar, editar ou excluir.

## Rotas

### APACs: todos os cargos

| Método   | Rota         | O que faz                 |
| -------- | ------------ | ------------------------- |
| `POST`   | `/apacs`     | Cria APAC (com PDF)       |
| `GET`    | `/apacs`     | Lista APACs               |
| `PATCH`  | `/apacs/:id` | Edita APAC                |
| `DELETE` | `/apacs/:id` | Exclui APAC e o PDF no R2 |

### Relatório de APACs: todos os cargos

| Método | Rota             | O que faz                                   |
| ------ | ---------------- | ------------------------------------------- |
| `POST` | `/reports/apacs` | Gera o relatório (ver `RELATORIO_APACS.md`) |

### Usuários: todos os cargos

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

### Documentos: todos, exceto `RECEPCIONISTA`

| Método   | Rota             | O que faz                                                   |
| -------- | ---------------- | ----------------------------------------------------------- |
| `POST`   | `/documents`     | Cria documento (com PDF)                                    |
| `GET`    | `/documents`     | Lista documentos                                            |
| `PATCH`  | `/documents/:id` | Edita documento                                             |
| `DELETE` | `/documents/:id` | Exclui documento e o PDF no R2 (ver `EXCLUIR_DOCUMENTO.md`) |

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

Qualquer cargo pode criar usuário de **qualquer** cargo, inclusive `DEV`. Por exemplo, uma recepcionista consegue criar um diretor. A API ainda não limita isso.

## Para o frontend

- As listas de permissão do front (`front/src/lib/permissions.ts`) devem seguir esta tabela. Na prática, só o `RECEPCIONISTA` deixa de ver o almoxarifado e os documentos.
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
