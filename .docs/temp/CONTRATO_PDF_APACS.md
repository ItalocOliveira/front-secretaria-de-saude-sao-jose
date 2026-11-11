# Contrato: PDF das APACs (anexar depois e `has_pdf`)

O PDF continua indo **direto do navegador para o R2** com uma URL assinada. A novidade: a API passa a saber
quais APACs têm PDF (`has_pdf`), e dá para anexar ou trocar o PDF de uma APAC já cadastrada.

Como o upload não passa pela API, **o front precisa avisar quando o envio terminar** (`/pdf/confirm`). A API
confere no bucket antes de marcar — não basta avisar sem ter enviado.

## Novo campo em todas as respostas de APAC

`has_pdf: boolean` em `GET /apacs` (cada item de `data`), `POST /apacs` (`apac`), `PATCH /apacs/:id` e na
resposta do `confirm`.

- `true` → o PDF foi enviado e confirmado. Mostre o link de download (`pdf_url`).
- `false` → sem PDF. Mostre o botão **"Anexar PDF"**.

`pdf_url` **continua vindo em toda APAC**, inclusive sem PDF (nesse caso o link dá 404). Use `has_pdf` para
decidir se mostra o link.

## Endpoints novos

Mesmos cargos de criar/editar APAC (todos os cargos com acesso a APACs, inclusive `RECEPCIONISTA`). Exigem
`Authorization: Bearer <token>` e o `X-Tenant`, como as demais rotas. Nenhum dos dois tem body.

### `POST /apacs/:id/pdf/upload-url`

Gera uma URL para enviar o PDF de uma APAC existente. Se ela já tiver PDF, o novo arquivo **substitui** o
anterior.

```json
200 { "uploadUrl": "https://...r2.cloudflarestorage.com/...?X-Amz-..." }
```

A `uploadUrl` vale por **15 minutos**.

### `POST /apacs/:id/pdf/confirm`

Chame **depois que o `PUT` no R2 responder com sucesso**. A API confere se o arquivo está no bucket e marca
`has_pdf = true`. Responde a APAC atualizada (mesmo formato do `PATCH /apacs/:id`). Pode ser chamado mais de
uma vez sem problema.

```json
200 { "id": "...", "name": "...", "has_pdf": true, ... }
```

### Erros

| Status | Quando                                          | Corpo                                                                                             |
| ------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `404`  | APAC não existe (ou é de outro município)       | `{ "error": "APAC não encontrada." }`                                                             |
| `409`  | `confirm` chamado sem o arquivo no bucket       | `{ "error": "O PDF ainda não foi recebido. Envie o arquivo pela uploadUrl e confirme de novo." }` |
| `401`  | Sem token, token inválido ou de outro município | `{ "message": "..." }`                                                                            |
| `403`  | Cargo sem acesso                                | —                                                                                                 |

## Fluxos

### Anexar PDF a uma APAC já cadastrada (novo)

```ts
const { uploadUrl } = await api.post(`/apacs/${id}/pdf/upload-url`)

const put = await fetch(uploadUrl, {
  method: "PUT",
  headers: { "Content-Type": "application/pdf" }, // obrigatório: a URL foi assinada com esse tipo
  body: file,
})
if (!put.ok) throw new Error("Falha ao enviar o PDF")

const apac = await api.post(`/apacs/${id}/pdf/confirm`) // apac.has_pdf === true
```

### Criar APAC com PDF (mudança no fluxo atual)

Igual a hoje, **mais a chamada de `confirm` no fim**. Sem ela, a APAC fica com `has_pdf: false` mesmo com o
arquivo enviado.

```ts
const { apac, uploadUrl } = await api.post("/apacs", dados)
if (file) {
  await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": "application/pdf" }, body: file })
  await api.post(`/apacs/${apac.id}/pdf/confirm`)
}
```

Se o `confirm` falhar depois de um `PUT` bem-sucedido (ex.: rede caiu), basta chamá-lo de novo — não precisa
reenviar o arquivo. Se responder `409`, o arquivo não chegou: gere outra `uploadUrl` e envie de novo.

## Sugestões de tela

- Na listagem, um ícone/estado "Sem PDF" quando `has_pdf` é `false`, com a ação "Anexar PDF".
- Com PDF, a ação "Substituir PDF" usa o mesmo fluxo (`upload-url` → `PUT` → `confirm`).
- Depois do `confirm`, atualize a APAC na lista com a resposta (ou recarregue a página).
