# 2026-11-12 — Sino de notificações e quantidade mínima de itens

Branch da API: `feat/notificacoes`. Mudança **aditiva**: nenhum campo existente mudou ou saiu,
então o front atual continua funcionando sem alteração.

## O que mudou

1. **Novo endpoint `GET /notifications`**: alertas reais para o sino do header (hoje mockado).
2. **Novo campo `min_amount` nos itens do almoxarifado**: quantidade mínima em estoque.
   Abaixo dela o item gera alerta.

---

## 1. `GET /notifications`

- **Headers:** `Authorization: Bearer <token>` e `X-Tenant`, como nas demais rotas.
- **Cargos:** `DEV`, `DIRETOR`, `SECRETARIO`, `COORDENADOR`, `REGULADOR`.
  A **`RECEPCIONISTA` recebe `403`**: esconda o sino para esse cargo e não chame a rota.
- Sem body e sem query string.

Os alertas são **automáticos**, calculados na hora a partir dos dados. Não existe "marcar como
lida": o alerta some sozinho quando o problema é resolvido (estoque reposto acima do mínimo, APAC
aprovada, negada, cancelada etc.).

### Resposta `200`

```json
{
  "total": 5,
  "lowStock": {
    "count": 3,
    "items": [{ "id": "uuid", "name": "DIPIRONA 500MG", "type": "MEDICAMENTO", "amount": 2, "min_amount": 10 }]
  },
  "urgentApacs": {
    "count": 2,
    "statuses": ["PENDENTE", "AGUARDO"],
    "items": [
      {
        "id": "uuid",
        "protocol_number": 123,
        "name": "MARIA DA SILVA",
        "procedure": "OCI_AVALIACAO_CARDIOLOGICA",
        "status": "PENDENTE",
        "created_at": "2026-11-10T13:00:00.000Z"
      }
    ]
  }
}
```

| Campo                  | Significado                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `total`                | Número do badge (`lowStock.count + urgentApacs.count`). Com `0`, não mostre o badge. |
| `lowStock.count`       | Total de itens com `amount < min_amount`.                                            |
| `lowStock.items`       | Até **10** desses itens, os de menor quantidade primeiro.                            |
| `urgentApacs.count`    | Total de APACs com prioridade `URGENTE` e status em `statuses`.                      |
| `urgentApacs.statuses` | Status considerados "na fila" (hoje `PENDENTE` e `AGUARDO`). Use para montar o link. |
| `urgentApacs.items`    | Até **10** dessas APACs, as mais antigas (que esperam há mais tempo) primeiro.       |

### Tipos sugeridos (TypeScript)

```ts
export interface LowStockItem {
  id: string
  name: string
  type: string
  amount: number
  min_amount: number
}

export interface UrgentApac {
  id: string
  protocol_number: number
  name: string
  procedure: string
  status: string
  created_at: string
}

export interface NotificationsResponse {
  total: number
  lowStock: { count: number; items: LowStockItem[] }
  urgentApacs: { count: number; statuses: string[]; items: UrgentApac[] }
}
```

### Como usar no sino

- **Badge:** `total`. Hoje o "12" está fixo no código; troque por esse valor.
- **Dropdown:** duas seções, "Estoque baixo" e "APACs urgentes pendentes".
  - Item: "DIPIRONA 500MG: 2 em estoque (mínimo 10)". Clique leva ao item no almoxarifado.
  - APAC: "#123 · MARIA DA SILVA · PENDENTE há 2 dias". Clique leva à APAC.
- **"Ver todos":** quando `count > items.length`, mostre um link para a listagem:
  - `/itens` (almoxarifado);
  - `/apacs?priority=URGENTE&status=PENDENTE` (a listagem aceita um `status` por vez).
- **Estado vazio:** com `total === 0`, mostre "Nenhum alerta".

### Atualização (polling)

Chame ao montar o layout e repita a cada 60 s enquanto a aba estiver visível. Com React Query:

```ts
useQuery({
  queryKey: ["notifications"],
  queryFn: () => api.get<NotificationsResponse>("/notifications").then((r) => r.data),
  enabled: role !== "RECEPCIONISTA",
  refetchInterval: 60_000,
  refetchIntervalInBackground: false,
})
```

Depois de registrar uma movimentação, editar um item ou editar uma APAC, chame
`queryClient.invalidateQueries({ queryKey: ["notifications"] })` para o badge atualizar na hora.

---

## 2. Campo `min_amount` nos itens

- **`POST /itens`** e **`PATCH /itens/:id`** aceitam `min_amount`: inteiro de `0` a `1000000`, ou
  `null` (vale `0`). É opcional e o padrão é `0`, que significa **sem alerta**.
- Diferente de `amount`, **pode ser alterado no `PATCH`**: é só o limite do alerta, não mexe no estoque.
- Todas as respostas de item (`GET /itens`, `POST`, `PATCH`, movimentação) passam a trazer
  `min_amount`.
- Itens que já existiam ficam com `0`, ou seja, sem alerta até alguém definir o mínimo.
- Valor inválido (negativo, decimal, texto) → `400`.

### O que fazer no front

- Formulário de **cadastro** de item: campo "Quantidade mínima" (número inteiro ≥ 0, opcional).
- Formulário de **edição** de item: o mesmo campo, editável.
- Opcional: na listagem do almoxarifado, destacar itens com `amount < min_amount`.

---

## 3. Paginação (lembrete, nada mudou)

As listagens (`/itens`, `/apacs`, `/documents`, `/users`) vêm com **50 por página por padrão,
no máximo 100**. Para 10 por página, mande `?pageSize=10` (ex.: `GET /itens?page=1&pageSize=10`).
