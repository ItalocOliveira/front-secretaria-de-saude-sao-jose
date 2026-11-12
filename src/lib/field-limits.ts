/**
 * Limites de tamanho que a API valida por schema (`MUDANCAS_CONTRATO_SEGURANCA.md`, seção 5).
 * Passar disso devolve `400` com mensagem em inglês do validador — o `maxLength` nos campos
 * impede o caso antes de chegar lá.
 */

/** `name` de usuário, APAC, ofício e item; `municipality`; `other_destination`; `destination` de movimento. */
export const MAX_NAME_LENGTH = 200

/** `note` de ofício e `description` de item. */
export const MAX_TEXT_LENGTH = 2000

/** `password` no login e no cadastro de usuário. */
export const MAX_PASSWORD_LENGTH = 128

/**
 * `amount` de item (`POST /itens`, 0 a este valor), `min_amount` (`POST`/`PATCH /itens`, 0 a este valor) e de movimentação (`POST /itens/:id/movements`,
 * 1 a este valor) — sempre inteiro. Fracionado, negativo ou acima disso → `400`.
 */
export const MAX_ITEM_AMOUNT = 1_000_000

/** Converte o texto de um `<input type="number">` em quantidade válida (inteira, entre `min` e `MAX_ITEM_AMOUNT`) ou `null`. */
export function parseItemAmount(value: string, min: number): number | null {
  if (value.trim() === "") return null
  const amount = Number(value)
  return Number.isInteger(amount) && amount >= min && amount <= MAX_ITEM_AMOUNT ? amount : null
}
