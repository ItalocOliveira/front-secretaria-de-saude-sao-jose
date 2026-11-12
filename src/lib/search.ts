/**
 * Busca tolerante para listas fixas (ex.: procedimentos de APAC).
 *
 * Ignora caixa, acentos e pontuação (hífen, ponto, barra…), e trata a busca
 * como um conjunto de palavras: cada palavra digitada precisa aparecer no
 * texto, em qualquer ordem. Assim "oci ortopedia" encontra
 * "OCI - AVALIAÇÃO DIAGNÓSTICA EM ORTOPEDIA…" e "cardiologia pediatria"
 * encontra "CONSULTA EM CARDIOLOGIA - PEDIATRIA".
 */
export function normalizeSearchText(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim()
}

/** `normalizedText` deve vir de `normalizeSearchText` (pré-calculado fora do render). */
export function matchesSearch(normalizedText: string, query: string) {
  const terms = normalizeSearchText(query).split(" ").filter(Boolean)

  return terms.every((term) => normalizedText.includes(term))
}
