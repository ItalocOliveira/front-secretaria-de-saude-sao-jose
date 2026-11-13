# Grupos do SISREG III como procedimentos genéricos

- **Branch da API:** `feat/registro-atividade-municipios`
- **Migration:** `20261114130000_grupos_sisreg` (aplicar depois de `20261114120000_procedimentos_sisreg`)
- **Compatibilidade:** **quebra** num ponto: `ULTRASSOM` foi renomeado para `ULTRASSONOGRAFIA_GERAL`. O resto é aditivo.

## Conceito

No SISREG, um **grupo** é um pedido genérico: "uma ressonância" ou "um ultrassom", sem dizer qual exame exato. No ICOS
o grupo é **mais um valor do enum `procedure`**. Cada APAC continua com um único `procedure`, que pode ser genérico
(o grupo) ou específico (o exame exato). Não existe campo novo.

## Mudanças no enum `Procedures`

### Renomeado (quebra)

| Antes       | Agora                    | Label sugerido           |
| ----------- | ------------------------ | ------------------------ |
| `ULTRASSOM` | `ULTRASSONOGRAFIA_GERAL` | ULTRASSONOGRAFIA - GERAL |

As APACs já gravadas foram migradas pelo banco (`RENAME VALUE`). A partir do deploy, `GET /apacs`, o relatório e as
notificações devolvem `ULTRASSONOGRAFIA_GERAL`, e `POST`/`PATCH` com `ULTRASSOM` respondem `400`.
**Publique o front junto com a API.**

### Novos (11)

| Valor                                    | Label sugerido                                    |
| ---------------------------------------- | ------------------------------------------------- |
| `ANATOMOPATOLOGIA_E_CITOPATOLOGIA`       | ANATOMOPATOLOGIA E CITOPATOLOGIA                  |
| `CIRURGIA_OFTALMOLOGICA`                 | CIRURGIA OFTALMOLOGICA                            |
| `EXAMES_HORMONAIS`                       | EXAMES HORMONAIS                                  |
| `IODOTERAPIA`                            | IODOTERAPIA                                       |
| `MEDICINA_NUCLEAR`                       | MEDICINA NUCLEAR                                  |
| `METODOS_DIAGNOSTICOS_EM_ESPECIALIDADES` | METODOS DIAGNOSTICOS EM ESPECIALIDADES            |
| `OFERTAS_DE_CUIDADOS_INTEGRADOS`         | PROCEDIMENTOS PARA OFERTAS DE CUIDADOS INTEGRADOS |
| `PROCEDIMENTOS_ENDOVASCULARES`           | PROCEDIMENTOS ENDOVASCULARES                      |
| `PUNCAO_E_BIOPSIA`                       | PUNCAO / BIOPSIA                                  |
| `RADIOLOGIA_INTERVENCIONISTA`            | RADIOLOGIA INTERVENCIONISTA                       |
| `ULTRASSONOGRAFIA_DOPPLER`               | ULTRASSONOGRAFIA DOPPLER                          |

### Grupos do SISREG que viraram um valor que já existia

| Grupo(s) no SISREG                                                                         | Valor no ICOS                    |
| ------------------------------------------------------------------------------------------ | -------------------------------- |
| EXAMES ULTRA-SONOGRAFICOS (geral, PPI, ONCOLOGIA, PEDIATRIA - INTERNADOS), ULTRASONOGRAFIA | `ULTRASSONOGRAFIA_GERAL`         |
| DIAGNOSTICO POR RADIOLOGIA, RADIODIAGNOSTICO                                               | `RAIO_X`                         |
| RESSONANCIA MAGNETICA (geral, PPI, SEDACAO)                                                | `RESSONANCIA_MAGNETICA`          |
| TOMOGRAFIA COMPUTADORIZADA (geral, ONCOLOGIA), DIAGNOSTICO POR TOMOGRAFIA (SEDACAO)        | `TOMOGRAFIA`                     |
| MAMOGRAFIA                                                                                 | `MAMOGRAFIA`                     |
| DIAGNOSTICO EM LABORATORIO CLINICO, PATOLOGIA CLINICA (EXAMES DE LABORATORIO)              | `EXAMES_LABORATORIAIS`           |
| DIAGNOSTICO EM OFTALMOLOGIA                                                                | `EXAMES_OFTALMOLOGICOS_EM_GERAL` |
| ELETRONEUROMIOGRAFIA                                                                       | `ELETRONEUROMIOGRAFIA`           |
| ELETROENCEFALOGRAMA (EEG)                                                                  | `ELETROENCEFALOGRAFIA`           |
| BIOPSIA PERCUTANEA GUIADA OU NAO P/ ULTRASSOM, PUNCAO / BIOPSIA                            | `PUNCAO_E_BIOPSIA` (novo)        |

"PPI" (pactuação entre municípios), "SEDACAO" e "ONCOLOGIA" não geram valores separados; se precisar, vão na observação
da APAC.

## O que o front precisa fazer (`src/lib/apac.ts`)

1. Em `APAC_PROCEDURE` e `APAC_PROCEDURE_LABEL`, trocar a chave `ULTRASSOM` por `ULTRASSONOGRAFIA_GERAL`
   (label `ULTRASSONOGRAFIA - GERAL`).
2. Adicionar os 11 valores novos:

```ts
// APAC_PROCEDURE
  ANATOMOPATOLOGIA_E_CITOPATOLOGIA: "ANATOMOPATOLOGIA_E_CITOPATOLOGIA",
  CIRURGIA_OFTALMOLOGICA: "CIRURGIA_OFTALMOLOGICA",
  EXAMES_HORMONAIS: "EXAMES_HORMONAIS",
  IODOTERAPIA: "IODOTERAPIA",
  MEDICINA_NUCLEAR: "MEDICINA_NUCLEAR",
  METODOS_DIAGNOSTICOS_EM_ESPECIALIDADES: "METODOS_DIAGNOSTICOS_EM_ESPECIALIDADES",
  OFERTAS_DE_CUIDADOS_INTEGRADOS: "OFERTAS_DE_CUIDADOS_INTEGRADOS",
  PROCEDIMENTOS_ENDOVASCULARES: "PROCEDIMENTOS_ENDOVASCULARES",
  PUNCAO_E_BIOPSIA: "PUNCAO_E_BIOPSIA",
  RADIOLOGIA_INTERVENCIONISTA: "RADIOLOGIA_INTERVENCIONISTA",
  ULTRASSONOGRAFIA_DOPPLER: "ULTRASSONOGRAFIA_DOPPLER",

// APAC_PROCEDURE_LABEL
  ANATOMOPATOLOGIA_E_CITOPATOLOGIA: "ANATOMOPATOLOGIA E CITOPATOLOGIA",
  CIRURGIA_OFTALMOLOGICA: "CIRURGIA OFTALMOLOGICA",
  EXAMES_HORMONAIS: "EXAMES HORMONAIS",
  IODOTERAPIA: "IODOTERAPIA",
  MEDICINA_NUCLEAR: "MEDICINA NUCLEAR",
  METODOS_DIAGNOSTICOS_EM_ESPECIALIDADES: "METODOS DIAGNOSTICOS EM ESPECIALIDADES",
  OFERTAS_DE_CUIDADOS_INTEGRADOS: "PROCEDIMENTOS PARA OFERTAS DE CUIDADOS INTEGRADOS",
  PROCEDIMENTOS_ENDOVASCULARES: "PROCEDIMENTOS ENDOVASCULARES",
  PUNCAO_E_BIOPSIA: "PUNCAO / BIOPSIA",
  RADIOLOGIA_INTERVENCIONISTA: "RADIOLOGIA INTERVENCIONISTA",
  ULTRASSONOGRAFIA_DOPPLER: "ULTRASSONOGRAFIA DOPPLER",
```

3. Filtros salvos, URLs ou qualquer texto fixo com `ULTRASSOM` precisam virar `ULTRASSONOGRAFIA_GERAL`.
