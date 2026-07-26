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
