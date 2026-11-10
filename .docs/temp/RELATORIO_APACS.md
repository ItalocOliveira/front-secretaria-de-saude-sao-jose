# Relatório de APACs — `POST /reports/apacs`

Devolve, em uma única chamada, os números de criação de APACs em um período: total,
comparação com o período anterior, contagens por categoria, fila de pendentes e uma série
temporal pronta para gráfico de linha.

## Requisição

```http
POST /reports/apacs
Authorization: Bearer <token>
Content-Type: application/json
```

| Perfil (`role`)                                                             | Acesso       |
| --------------------------------------------------------------------------- | ------------ |
| `DEV`, `SECRETARIA`, `DIRETOR`, `RECEPCIONISTA`, `REGULADOR`, `COORDENADOR` | ✅ permitido |

> É `POST` (e não `GET`) porque os filtros vão no corpo. A rota não altera nada.

### Corpo

Todos os campos são opcionais.

| Campo       | Tipo                | Padrão    | Descrição                                          |
| ----------- | ------------------- | --------- | -------------------------------------------------- |
| `startDate` | `string` (ISO 8601) | mês atual | Início do período (inclusive).                     |
| `endDate`   | `string` (ISO 8601) | mês atual | Fim do período (inclusive).                        |
| `interval`  | `"day" \| "week"`   | `"day"`   | Agrupamento da série temporal (`createdOverTime`). |

**Regras importantes:**

- **Envie `startDate` e `endDate` juntos.** Se só uma das duas vier, ela é **ignorada sem
  aviso** e o relatório usa o mês atual.
- **Sem datas → mês atual**, do dia 1 às 00:00 até o último dia às 23:59:59.999.
- **Envie as datas com o fuso de Brasília** para os limites baterem com o dia local:
  `"2026-11-01T00:00:00-03:00"` / `"2026-11-30T23:59:59.999-03:00"`. Uma data com `Z`
  (UTC) desloca o período em 3h.
- O "mês atual" do corpo vazio é calculado no horário de Brasília (`America/Fortaleza`),
  então `{}` é a forma mais simples de pedir o mês corrente.
- Se não for mandar nenhum campo, envie `{}`. Corpo vazio **com** o header
  `Content-Type: application/json` retorna `400` do Fastify.
- `startDate` depois de `endDate` não gera erro: o relatório volta zerado. Valide no front.

### Exemplos

```json
{}
```

```json
{
  "startDate": "2026-10-01T00:00:00-03:00",
  "endDate": "2026-10-31T23:59:59.999-03:00",
  "interval": "week"
}
```

## Resposta `200`

```json
{
  "period": {
    "startDate": "2026-10-01T03:00:00.000Z",
    "endDate": "2026-11-01T02:59:59.999Z"
  },
  "totalCreatedINperiod": 2,
  "comparisonWithPreviousPeriod": {
    "previousPeriod": {
      "startDate": "2026-08-31T03:00:00.000Z",
      "endDate": "2026-10-01T02:59:59.999Z"
    },
    "previousTotal": 1,
    "difference": 1,
    "percentChange": 100
  },
  "countByStatusInPeriod": { "APROVADO": 2 },
  "countByStatus": { "APROVADO": 3, "PENDENTE": 1 },
  "countByProcedureInPeriod": {
    "CONSULTA_EM_ODONTOLOGIA_CIRURGIA_BUCO_MAXILO_FACIAL": 1,
    "OCI_AVALIACAO_CARDIOLOGICA": 1
  },
  "countByPriorityInPeriod": { "ELETIVO": 2 },
  "countByAcsInPeriod": { "MARIA_JOSE_DE_ARAUJO": 1, "LEYDIANE_ARAUJO": 1 },
  "countByMunicipalityInPeriod": { "Caldas Brandão": 1, "Sapé": 1 },
  "pendingQueue": {
    "statuses": ["PENDENTE", "AGUARDO"],
    "total": 1,
    "byPriority": { "URGENTE": 0, "ELETIVO": 1 }
  },
  "createdOverTime": {
    "interval": "week",
    "timeZone": "America/Fortaleza",
    "points": [
      { "date": "2026-09-28", "count": 1 },
      { "date": "2026-10-05", "count": 1 },
      { "date": "2026-10-12", "count": 0 },
      { "date": "2026-10-19", "count": 0 },
      { "date": "2026-10-26", "count": 0 }
    ]
  }
}
```

### Campos

Todas as datas de `period` e `previousPeriod` vêm em **UTC** (`Z`). Converta para o fuso
local antes de exibir (`2026-10-01T03:00:00.000Z` = 01/10 00:00 em Brasília).

#### Totais e comparação

| Campo                                         | Tipo                   | Descrição                                                                                                     |
| --------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| `period.startDate` / `period.endDate`         | `string`               | Período efetivamente usado (útil quando o corpo veio vazio).                                                  |
| `totalCreatedINperiod`                        | `number`               | APACs **criadas** no período.                                                                                 |
| `comparisonWithPreviousPeriod.previousPeriod` | `{startDate, endDate}` | Período usado na comparação (ver regra abaixo).                                                               |
| `comparisonWithPreviousPeriod.previousTotal`  | `number`               | APACs criadas no período anterior.                                                                            |
| `comparisonWithPreviousPeriod.difference`     | `number`               | `totalCreatedINperiod - previousTotal`. Pode ser negativo.                                                    |
| `comparisonWithPreviousPeriod.percentChange`  | `number \| null`       | Variação em %, 1 casa decimal (`18.2` = +18,2%; `-50` = queda de 50%). **`null` quando `previousTotal` é 0.** |

**Como o período anterior é escolhido:**

- **Corpo sem datas (mês atual):** o mês de calendário anterior inteiro.
- **Datas enviadas:** um período com a **mesma duração**, imediatamente antes de
  `startDate`. Ex.: 10 a 19/nov → 31/out a 09/nov. Ex.: outubro inteiro (31 dias) → 31/ago a
  30/set. Se o front quer "outubro vs. setembro" exato, não há como pedir isso hoje — use
  o texto genérico "em relação ao período anterior", ou "mês passado" só quando mandar o
  corpo vazio.

**Exibição sugerida:** `percentChange > 0` → "+18,2% em relação ao período anterior" (verde);
`< 0` → "−50%" (vermelho); `0` → "Sem variação"; `null` → mostre só a `difference`
(ex.: "+4 (nenhuma no período anterior)").

#### Contagens por categoria — `Record<string, number>`

| Campo                         | Filtro de data                         | Chaves                                                     |
| ----------------------------- | -------------------------------------- | ---------------------------------------------------------- |
| `countByStatusInPeriod`       | período                                | `Status`                                                   |
| `countByStatus`               | **nenhum** (todas as APACs do sistema) | `Status`                                                   |
| `countByProcedureInPeriod`    | período                                | `Procedures`                                               |
| `countByPriorityInPeriod`     | período                                | `Priorities`                                               |
| `countByAcsInPeriod`          | período                                | `Acs`                                                      |
| `countByMunicipalityInPeriod` | período                                | texto livre do cadastro; sem município → `"NAO_INFORMADO"` |

- **Chaves com 0 não aparecem.** Ex.: se nenhuma APAC do período foi negada, não existe
  `"NEGADO"` no objeto. Trate a ausência como 0 (`obj[key] ?? 0`).
- As chaves são os **valores crus dos enums** (`"OCI_AVALIACAO_CARDIOLOGICA"`,
  `"MARIA_JOSE_DE_ARAUJO"`). Use os mesmos mapas de rótulo que o front já usa nas telas de
  APAC para exibir nomes legíveis.
- Município é texto livre: grafias diferentes ("Sapé" / "Sape") viram chaves diferentes.
- Para gráfico (barra/pizza), converta: `Object.entries(obj).map(([key, count]) => ({ key, count }))`
  e ordene por `count` decrescente.

Valores possíveis:

- **`Status`:** `PENDENTE`, `AGUARDO`, `APROVADO`, `CANCELADO`, `NEGADO`, `ENTREGUE`
- **`Priorities`:** `URGENTE`, `ELETIVO`

#### Fila de pendentes — `pendingQueue`

**Estado atual da fila, sem filtro de data** — não muda com o período escolhido.

| Campo        | Tipo                     | Descrição                                                                   |
| ------------ | ------------------------ | --------------------------------------------------------------------------- |
| `statuses`   | `Status[]`               | Quais status contam como "na fila" (hoje `PENDENTE` e `AGUARDO`).           |
| `total`      | `number`                 | Total de APACs na fila.                                                     |
| `byPriority` | `Record<string, number>` | Fila por prioridade. **Todas as prioridades sempre aparecem**, mesmo com 0. |

Sugestão: destaque `byPriority.URGENTE > 0` como alerta.

#### Série temporal — `createdOverTime`

| Campo      | Tipo                                | Descrição                                                                                       |
| ---------- | ----------------------------------- | ----------------------------------------------------------------------------------------------- |
| `interval` | `"day" \| "week"`                   | Agrupamento usado.                                                                              |
| `timeZone` | `string`                            | Fuso usado para decidir o dia de cada APAC (`America/Fortaleza`).                               |
| `points`   | `{ date: string; count: number }[]` | Ordenado por data. `date` é `"YYYY-MM-DD"` — o dia, ou a **segunda-feira** que inicia a semana. |

- **Dias/semanas sem APAC vêm com `count: 0`**: dá para passar `points` direto para o
  gráfico, sem preencher lacunas.
- `date` já é a data local; **não** converta com `new Date("2026-10-05")` (o JS interpreta
  como UTC e mostra 04/10). Formate a string direto ou faça o parse como data local.
- Com `"week"`, o primeiro ponto pode ter data **anterior** ao `startDate` (ex.: período
  começando em 01/10, quinta-feira → primeiro ponto `2026-09-28`, segunda). A contagem só
  inclui APACs dentro do período.
- Sugestão: `"day"` para períodos de até ~2 meses, `"week"` para períodos maiores.

Exemplo com `recharts`:

```tsx
<LineChart data={report.createdOverTime.points}>
  <XAxis dataKey="date" tickFormatter={(d: string) => d.split("-").reverse().slice(0, 2).join("/")} />
  <YAxis allowDecimals={false} />
  <Tooltip />
  <Line type="monotone" dataKey="count" name="APACs criadas" />
</LineChart>
```

## Erros

| Status | Quando                                               | Corpo                                                                                         |
| ------ | ---------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `400`  | `interval` diferente de `"day"`/`"week"`             | `{ "error": "Valor inválido para \"interval\". Use um destes: day, week." }`                  |
| `400`  | `startDate`/`endDate` não são datas válidas          | `{ "error": "Datas inválidas. Envie \"startDate\" e \"endDate\" no formato ISO 8601 (...)" }` |
| `400`  | Corpo vazio com `Content-Type: application/json`     | erro padrão do Fastify (`FST_ERR_CTP_EMPTY_JSON_BODY`) — envie `{}`                           |
| `401`  | Sem token, token inválido ou expirado (validade: 1h) | `{ "message": "Token inválido ou expirado." }`                                                |
| `403`  | Perfil sem permissão                                 | `{ "message": "Acesso negado. Privilégios insuficientes." }`                                  |
| `500`  | Erro interno                                         | `{ "error": "Erro interno ao gerar relatório de APACs", ... }`                                |

Nos `400` da API, a mensagem em `error` pode ser exibida diretamente ao usuário.

## Tipos TypeScript

```ts
type ApacStatus = "PENDENTE" | "AGUARDO" | "APROVADO" | "CANCELADO" | "NEGADO" | "ENTREGUE"

interface ReportApacsRequest {
  startDate?: string // ISO 8601, com offset (ex.: "2026-11-01T00:00:00-03:00")
  endDate?: string
  interval?: "day" | "week"
}

interface ReportApacsResponse {
  period: { startDate: string; endDate: string } // UTC
  totalCreatedINperiod: number
  comparisonWithPreviousPeriod: {
    previousPeriod: { startDate: string; endDate: string } // UTC
    previousTotal: number
    difference: number
    percentChange: number | null // null quando previousTotal === 0
  }
  countByStatusInPeriod: Record<string, number> // chaves ausentes = 0
  countByStatus: Record<string, number> // todas as APACs, sem filtro de data
  countByProcedureInPeriod: Record<string, number>
  countByPriorityInPeriod: Record<string, number>
  countByAcsInPeriod: Record<string, number>
  countByMunicipalityInPeriod: Record<string, number> // "NAO_INFORMADO" = sem município
  pendingQueue: {
    statuses: ApacStatus[]
    total: number
    byPriority: Record<string, number> // todas as prioridades presentes
  }
  createdOverTime: {
    interval: "day" | "week"
    timeZone: string
    points: { date: string; count: number }[] // date = "YYYY-MM-DD" local, com zeros
  }
}
```
