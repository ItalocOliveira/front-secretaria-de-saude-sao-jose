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
