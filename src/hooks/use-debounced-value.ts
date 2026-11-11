import { useEffect, useState } from "react"

/**
 * Valor que só acompanha o original depois de `delay` ms sem mudança. Usado na busca das
 * listagens: cada tecla viraria um `GET` (e o rate limit da API é de 300 req/min por IP).
 */
export function useDebouncedValue<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])

  return debounced
}
