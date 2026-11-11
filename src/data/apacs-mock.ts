/**
 * O que a API ainda não fornece.
 *
 * `MUNICIPALITIES` — `municipality` é texto livre no modelo `Apac` e não há
 * endpoint que liste os municípios atendidos. A lista existe para o `Select`
 * não virar campo aberto. O filtro vai para `GET /apacs?municipality=` e compara o
 * nome inteiro (acentos contam) — por isso cadastro, edição e filtro usam esta mesma lista.
 *
 * Nenhum CPF ou CNS real aparece aqui.
 */

export const MUNICIPALITIES = ["São José dos Ramos", "João Pessoa", "Sapé", "Caldas Brandão", "Mari"] as const
