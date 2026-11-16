# Relatório: seção do almoxarifado

**API:** branch `fix/atividade-nome-exclusao` · **Aditivo** (nenhum campo existente mudou).

`POST /reports/apacs` (mesmo body: `startDate`, `endDate`, `interval`) agora devolve também `inventory`:

- **Cargos com acesso ao almoxarifado** (`DEV`, `DIRETOR`, `SECRETARIO`, `COORDENADOR`, `REGULADOR`): objeto abaixo.
- **`RECEPCIONISTA`**: `inventory: null` — esconda a seção.

```json
"inventory": {
  "stock": {
    "totalItems": 42,
    "totalUnits": 1830,
    "lowStockCount": 3,
    "byType": { "MEDICAMENTO": { "items": 20, "units": 1200 }, "EQUIPAMENTO": { "items": 0, "units": 0 } },
    "byStatus": { "DISPONIVEL": 40, "EMPRESTADO": 2 }
  },
  "movementsInPeriod": {
    "entries": { "count": 12, "units": 500 },
    "outputs": { "count": 30, "units": 210 },
    "balance": 290,
    "outputsByDestination": { "UBS Centro": { "count": 10, "units": 80 } },
    "topOutputItems": [
      { "id": "uuid", "name": "Dipirona 500mg", "type": "MEDICAMENTO", "amount": 120, "units": 60 }
    ]
  }
}
```

- `stock` é o **estado atual**, sem filtro de data. `byType`/`byStatus` trazem todos os valores do enum, mesmo zerados. `lowStockCount` = itens com `amount < min_amount` (mesmo critério do sino).
- `movementsInPeriod` usa o `dateTime` das movimentações dentro de `period`. `units` = soma das quantidades; `balance` = entradas − saídas (unidades). Entradas incluem o "Estoque inicial" de itens cadastrados no período.
- `outputsByDestination` agrupa as **saídas** pelo texto livre de `destination` (grafias diferentes viram chaves diferentes).
- `topOutputItems`: até 10 itens mais retirados no período (por unidades); `amount` é o estoque atual.

```ts
type MovementTotals = { count: number; units: number }
type ReportInventory = {
  stock: {
    totalItems: number
    totalUnits: number
    lowStockCount: number
    byType: Record<string, { items: number; units: number }>
    byStatus: Record<string, number>
  }
  movementsInPeriod: {
    entries: MovementTotals
    outputs: MovementTotals
    balance: number
    outputsByDestination: Record<string, MovementTotals>
    topOutputItems: { id: string; name: string; type: string; amount: number; units: number }[]
  }
}
// ReportApacs.inventory: ReportInventory | null
```
