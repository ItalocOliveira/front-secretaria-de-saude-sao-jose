# 2026-11-12 — Padronização dos procedimentos das APACs

Branch da API: `feat/padronizacao-procedimentos`. Migration: `20261112160000_padronizando_procedures`.

**Esta mudança quebra compatibilidade.** Seis valores do enum `procedure` mudaram de nome. A
migration usa `RENAME VALUE`, então as APACs já gravadas passam a vir com o nome novo
automaticamente. Depois do deploy, a API **recusa com `400` os nomes antigos** em `POST /apacs` e
`PATCH /apacs/:id`. Atualize o front **junto com o deploy da API**.

Rotas afetadas, todas pelo campo `procedure`:

- `POST /apacs` e `PATCH /apacs/:id` (body);
- `GET /apacs` (resposta);
- `POST /reports/apacs` (chaves de `countByProcedureInPeriod`);
- `GET /notifications` (`urgentApacs.items[].procedure`).

---

## 1. Valores renomeados

| Nome antigo (deixa de existir)                             | Nome novo                                                        | Motivo                            |
| ---------------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------- |
| `OCI_AVALIACAO_DIAGNOSTICA_ORTOPEDIA_RECURSOS_RADIOLOGIA`  | `OCI_AVALIACAO_DIAGNOSTICA_EM_ORTOPEDIA_COM_RECURSOS_RADIOLOGIA` | Nome oficial (limite de 63 bytes) |
| `OCI_AVALIACAO_DIAGNOSTICA_DE_NASORAFINGE_E_DE_OROFARINGE` | `OCI_AVALIACAO_DIAGNOSTICA_DE_NASOFARINGE_E_DE_OROFARINGE`       | Erro de digitação                 |
| `CONSULTA_EM_ALERGIA_E_IMUNOLOGIA_PEDIATRICA`              | `CONSULTA_EM_ALERGIA_E_IMUNOLOGIA_PEDIATRIA`                     | Sufixo pediátrico padronizado     |
| `CONSULTA_EM_OTORRINOLARINGOLOGIA_PEDIATRICA`              | `CONSULTA_EM_OTORRINOLARINGOLOGIA_PEDIATRIA`                     | Sufixo pediátrico padronizado     |
| `CONSULTA_EM_DERMATOLOGIA_ADULTO`                          | `CONSULTA_EM_DERMATOLOGIA`                                       | Sem sufixo = adulto               |
| `CONSULTA_EM_NEUROCIRURGIA_ADULTO`                         | `CONSULTA_EM_NEUROCIRURGIA`                                      | Sem sufixo = adulto               |

> **Atenção à OCI de ortopedia.** O front hoje (`src/lib/apac.ts`) usa
> `OCI_AVALIACAO_DIAGNOSTICA_EM_ORTOPEDIA_COM_RECURSOS_DE_RADIOLOGIA`, um valor que **nunca existiu na
> API**: criar uma APAC com essa OCI sempre deu `400`. O nome completo também não pode existir, porque
> o PostgreSQL limita cada valor de enum a 63 bytes e ele tem 65. O valor oficial ficou
> `OCI_AVALIACAO_DIAGNOSTICA_EM_ORTOPEDIA_COM_RECURSOS_RADIOLOGIA`, **sem o `DE`**. Troque a chave e o
> valor no front. O rótulo exibido pode continuar com o nome oficial completo.
>
> Os demais valores da tabela também precisam ser trocados no front.

Regra de nomes que vale daqui em diante:

- Consultas: `CONSULTA_EM_<ESPECIALIDADE>` para adulto e `CONSULTA_EM_<ESPECIALIDADE>_PEDIATRIA` para criança.
  A exceção é `CONSULTA_EM_CIRURGIA_PEDIATRICA`, porque "Cirurgia Pediátrica" é o nome da especialidade.
- OCIs: `OCI_` + nome oficial da OCI no SIGTAP, sem acentos e com as preposições, respeitando o limite de
  63 bytes do PostgreSQL (por isso a de ortopedia perdeu o `DE`).

## 2. Valores novos

Cada OCI ganhou uma consulta padrão da mesma especialidade:

| OCI                                                              | Consulta correspondente                         |
| ---------------------------------------------------------------- | ----------------------------------------------- |
| `OCI_AVALIACAO_CARDIOLOGICA`                                     | `CONSULTA_EM_CARDIOLOGIA` **(nova)**            |
| `OCI_AVALIACAO_INICIAL_EM_OFTALMOLOGIA_A_PARTIR_DE_9_ANOS`       | `CONSULTA_EM_OFTALMOLOGIA` **(nova)**           |
| `OCI_AVALIACAO_INICIAL_EM_OFTALMOLOGIA_0_A_8_ANOS`               | `CONSULTA_EM_OFTALMOLOGIA_PEDIATRIA` **(nova)** |
| `OCI_AVALIACAO_DIAGNOSTICA_EM_ORTOPEDIA_COM_RECURSOS_RADIOLOGIA` | `CONSULTA_EM_ORTOPEDIA_GERAL` **(nova)**        |
| `OCI_AVALIACAO_INICIAL_DIAGNOSTICA_DE_DEFICIT_AUDITIVO`          | `CONSULTA_EM_OTORRINOLARINGOLOGIA` (já existia) |
| `OCI_AVALIACAO_DIAGNOSTICA_DE_NASOFARINGE_E_DE_OROFARINGE`       | `CONSULTA_EM_OTORRINOLARINGOLOGIA` (já existia) |

`CONSULTA_EM_ORTOPEDIA_GERAL` mantém o `_GERAL` para combinar com o
`CONSULTA_EM_ORTOPEDIA_GERAL_PEDIATRIA`, que já existia.

Exame novo: `EXAMES_DE_SANGUE`. Ele é diferente de `EXAMES_LABORATORIAIS`, que continua existindo.

---

## O que o front precisa fazer

Em `src/lib/apac.ts`, nos dois mapas (valor e rótulo):

1. Trocar as chaves e valores antigos da tabela 1 pelos novos (incluindo a OCI de ortopedia que o front já tinha).
2. Adicionar os cinco valores novos. Rótulos sugeridos, no mesmo estilo dos atuais:

```ts
// mapa de valores
OCI_AVALIACAO_DIAGNOSTICA_EM_ORTOPEDIA_COM_RECURSOS_RADIOLOGIA: "OCI_AVALIACAO_DIAGNOSTICA_EM_ORTOPEDIA_COM_RECURSOS_RADIOLOGIA",
CONSULTA_EM_ALERGIA_E_IMUNOLOGIA_PEDIATRIA: "CONSULTA_EM_ALERGIA_E_IMUNOLOGIA_PEDIATRIA",
CONSULTA_EM_OTORRINOLARINGOLOGIA_PEDIATRIA: "CONSULTA_EM_OTORRINOLARINGOLOGIA_PEDIATRIA",
CONSULTA_EM_DERMATOLOGIA: "CONSULTA_EM_DERMATOLOGIA",
CONSULTA_EM_NEUROCIRURGIA: "CONSULTA_EM_NEUROCIRURGIA",
OCI_AVALIACAO_DIAGNOSTICA_DE_NASOFARINGE_E_DE_OROFARINGE: "OCI_AVALIACAO_DIAGNOSTICA_DE_NASOFARINGE_E_DE_OROFARINGE",
CONSULTA_EM_CARDIOLOGIA: "CONSULTA_EM_CARDIOLOGIA",
CONSULTA_EM_OFTALMOLOGIA: "CONSULTA_EM_OFTALMOLOGIA",
CONSULTA_EM_OFTALMOLOGIA_PEDIATRIA: "CONSULTA_EM_OFTALMOLOGIA_PEDIATRIA",
CONSULTA_EM_ORTOPEDIA_GERAL: "CONSULTA_EM_ORTOPEDIA_GERAL",
EXAMES_DE_SANGUE: "EXAMES_DE_SANGUE",

// mapa de rótulos
OCI_AVALIACAO_DIAGNOSTICA_EM_ORTOPEDIA_COM_RECURSOS_RADIOLOGIA: "OCI - AVALIAÇÃO DIAGNÓSTICA EM ORTOPEDIA COM RECURSOS DE RADIOLOGIA",
CONSULTA_EM_ALERGIA_E_IMUNOLOGIA_PEDIATRIA: "CONSULTA EM ALERGIA E IMUNOLOGIA - PEDIATRIA",
CONSULTA_EM_OTORRINOLARINGOLOGIA_PEDIATRIA: "CONSULTA EM OTORRINOLARINGOLOGIA - PEDIATRIA",
CONSULTA_EM_DERMATOLOGIA: "CONSULTA EM DERMATOLOGIA",
CONSULTA_EM_NEUROCIRURGIA: "CONSULTA EM NEUROCIRURGIA",
OCI_AVALIACAO_DIAGNOSTICA_DE_NASOFARINGE_E_DE_OROFARINGE: "OCI - AVALIAÇÃO DIAGNÓSTICA DE NASOFARINGE E DE OROFARINGE",
CONSULTA_EM_CARDIOLOGIA: "CONSULTA EM CARDIOLOGIA",
CONSULTA_EM_OFTALMOLOGIA: "CONSULTA EM OFTALMOLOGIA",
CONSULTA_EM_OFTALMOLOGIA_PEDIATRIA: "CONSULTA EM OFTALMOLOGIA - PEDIATRIA",
CONSULTA_EM_ORTOPEDIA_GERAL: "CONSULTA EM ORTOPEDIA GERAL",
EXAMES_DE_SANGUE: "EXAMES DE SANGUE",
```

3. Se algum filtro, gráfico ou cor estiver fixado por nome de procedimento, troque os nomes antigos lá também.
   O relatório passa a devolver só os nomes novos em `countByProcedureInPeriod`.
