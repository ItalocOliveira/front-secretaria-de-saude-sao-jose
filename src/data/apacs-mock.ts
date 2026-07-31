/**
 * O que a API ainda não fornece.
 *
 * Depois da integração, sobraram só duas listas — as demais viraram dados reais
 * de `GET /apacs` e `GET /users`:
 *
 * - `MUNICIPALITIES` — `municipality` é texto livre no modelo `Apac` e não há
 *   endpoint que liste os municípios atendidos. A lista existe para o `Select`
 *   não virar campo aberto; o filtro é client-side.
 * - `UNITS` — unidade de saúde não existe no contrato (nem em `Apac`, nem em
 *   `User`). O seletor no rodapé da sidebar é decorativo enquanto isso.
 *
 * Nenhum CPF ou CNS real aparece aqui.
 */

export const UNITS = [
  "Policlínica Municipal São João",
  "UBS Centro",
  "UBS Nova Esperança",
  "Hospital Municipal Dr. Ramos",
] as const

export const MUNICIPALITIES = ["São José dos Ramos", "João Pessoa", "Sapé", "Caldas Brandão", "Mari"] as const
