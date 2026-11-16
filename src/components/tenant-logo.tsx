import { useState, type ReactNode } from "react"

import type { TenantLogoKind } from "@/api/auth"
import { useTenant } from "@/hooks/use-tenant"

/**
 * Logo do município (`GET /auth/tenant` → `logos`). A URL é assinada e expira em 1 hora, mas o
 * município fica em cache eterno: se a imagem falhar, pedimos o município de novo (URL nova) —
 * uma vez só por montagem, para uma logo quebrada no R2 não virar loop de requisições.
 * Sem logo (`null`), sem campo ou depois de falhar de novo, renderiza `fallback`.
 */
export function TenantLogo({
  kind,
  alt,
  className,
  fallback = null,
}: {
  kind: TenantLogoKind
  alt: string
  className?: string
  fallback?: ReactNode
}) {
  const { data, refetch } = useTenant()
  const src = data?.logos?.[kind] ?? null
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const [retried, setRetried] = useState(false)

  if (src === null || src === failedSrc) {
    return fallback
  }

  const handleError = () => {
    setFailedSrc(src)

    if (!retried) {
      setRetried(true)
      void refetch()
    }
  }

  return <img src={src} alt={alt} className={className} onError={handleError} />
}
