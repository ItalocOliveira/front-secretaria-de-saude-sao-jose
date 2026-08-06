import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Função utilitária para combinar classes CSS de forma condicional e otimizada.
 * @param inputs - Uma lista de valores de classe que podem ser strings, objetos ou arrays.
 * @returns Uma string contendo as classes combinadas e otimizadas.
 *
 * @example
 * ```ts
 * cn("class1", { "class2": true }, ["class3", "class4"])
 * // => "class1 class2 class3 class4"
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Remove tudo que não for dígito; opcionalmente trunca (ex.: CPF = 11, CNS = 15). */
export function onlyDigits(value: string, maxLength?: number) {
  const digits = value.replaceAll(/\D/g, "")
  return maxLength === undefined ? digits : digits.slice(0, maxLength)
}

/** Formata progressivamente para `000.000.000-00` — aceita dígitos crus ou já mascarados. */
export function formatCpf(value: string) {
  const digits = onlyDigits(value, 11)
  const [, p1, p2, p3, p4] = digits.match(/^(\d{0,3})(\d{0,3})?(\d{0,3})?(\d{0,2})?$/) ?? []

  return [p1, p2 && `.${p2}`, p3 && `.${p3}`, p4 && `-${p4}`].filter(Boolean).join("")
}
