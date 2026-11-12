# Contrato: imagem dos itens do almoxarifado (anexar depois e `has_image`)

Mesmo modelo do PDF das APACs (`CONTRATO_PDF_APACS.md`): a imagem vai **direto do navegador para o R2** com uma
URL assinada, e agora dá para anexar ou trocar a imagem de um item **já cadastrado**. A API passa a saber quais
itens têm imagem (`has_image`).

Como o upload não passa pela API, **o front precisa avisar quando o envio terminar** (`/image/confirm`). A API
confere no bucket antes de marcar.

## Novo campo em todas as respostas de item

`has_image: boolean` em `GET /itens` (cada item de `data`), `POST /itens` (`item`), `PATCH /itens/:id`,
`POST /itens/:id/movements` (`item`) e na resposta do `confirm`.

- `true` → imagem enviada e confirmada. Mostre a imagem (`image_url`).
- `false` → sem imagem. Mostre um placeholder e o botão **"Adicionar imagem"**.

`image_url` **continua vindo em todo item de `GET /itens`**, inclusive sem imagem (nesse caso o link dá 404). Use
`has_image` para decidir se renderiza o `<img>`.

## Endpoints novos

Mesmos cargos do almoxarifado (`FULL_ACCESS_ROLES`: `DEV`, `DIRETOR`, `SECRETARIO`, `COORDENADOR`, `REGULADOR`).
Exigem `Authorization: Bearer <token>` e o `X-Tenant`, como as demais rotas. Nenhum dos dois tem body.

### `POST /itens/:id/image/upload-url`

Gera uma URL para enviar a imagem de um item existente. Se ele já tiver imagem, a nova **substitui** a anterior.

```json
200 { "uploadUrl": "https://...r2.cloudflarestorage.com/...?X-Amz-..." }
```

A `uploadUrl` vale por **15 minutos**. Diferente do PDF, a URL **não** é assinada com um `Content-Type` fixo:
envie o tipo real do arquivo (`file.type`, ex. `image/png`, `image/jpeg`) para o navegador exibir certo depois.

### `POST /itens/:id/image/confirm`

Chame **depois que o `PUT` no R2 responder com sucesso**. A API confere se o arquivo está no bucket e marca
`has_image = true`. Responde o item atualizado (mesmo formato do `PATCH /itens/:id`, com `movements`). Pode ser
chamado mais de uma vez.

```json
200 { "id": "...", "name": "...", "has_image": true, "movements": [...], ... }
```

O item devolvido **não traz `image_url`** (assim como o `PATCH`). Para exibir a imagem nova, recarregue a lista
(`GET /itens`) ou use um `URL.createObjectURL(file)` local.

### Erros

| Status | Quando                                          | Corpo                                                                                                |
| ------ | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `404`  | Item não existe (ou é de outro município)       | `{ "error": "Item não encontrado." }`                                                                |
| `409`  | `confirm` chamado sem o arquivo no bucket       | `{ "error": "A imagem ainda não foi recebida. Envie o arquivo pela uploadUrl e confirme de novo." }` |
| `401`  | Sem token, token inválido ou de outro município | `{ "message": "..." }`                                                                               |
| `403`  | Cargo sem acesso ao almoxarifado                | —                                                                                                    |

## Fluxos

### Adicionar/trocar imagem de um item já cadastrado (novo)

```ts
const { uploadUrl } = await api.post(`/itens/${id}/image/upload-url`)

const put = await fetch(uploadUrl, {
  method: "PUT",
  headers: { "Content-Type": file.type },
  body: file,
})
if (!put.ok) throw new Error("Falha ao enviar a imagem")

const item = await api.post(`/itens/${id}/image/confirm`) // item.has_image === true
await refetchItens() // para pegar o image_url novo
```

### Criar item com imagem (mudança no fluxo atual)

Igual a hoje, **mais a chamada de `confirm` no fim**. Sem ela o item fica com `has_image: false` mesmo com o
arquivo enviado.

```ts
const { item, uploadUrl } = await api.post("/itens", dados)
if (file) {
  await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file })
  await api.post(`/itens/${item.id}/image/confirm`)
}
```

Se o `PUT` falhar na criação, o item já existe: ofereça "Tentar de novo" usando o fluxo de anexar acima, sem
recriar o item.

## Itens antigos

Itens cadastrados antes desta mudança começam com `has_image: false`. O backend roda `npm run backfill-item-image`,
que confere o bucket e marca os que já têm imagem. Até lá (ou se o front publicado ainda não chamar o `confirm`),
um item com imagem pode aparecer como `false` — o botão "Adicionar imagem" resolve.

## Fora do escopo

As imagens das **movimentações** (`movements[].image_url`) continuam como estão: enviadas só na criação da
movimentação, sem `has_image` e sem rota para anexar depois.
