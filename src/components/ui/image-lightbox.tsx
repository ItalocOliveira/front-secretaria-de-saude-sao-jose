import { useEffect } from "react"
import { createPortal } from "react-dom"
import { XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

/** Overlay simples (fora da árvore de `Dialog`) pra evitar conflito de fechamento por clique fora entre dialogs aninhados do Base UI. */
export function ImageLightbox({ src, onOpenChange }: { src: string | null; onOpenChange: (open: boolean) => void }) {
  useEffect(() => {
    if (src === null) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [src, onOpenChange])

  if (src === null) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={() => onOpenChange(false)}
    >
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Fechar"
        className="absolute top-4 right-4 text-white hover:bg-white/10 hover:text-white"
        onClick={() => onOpenChange(false)}
      >
        <XIcon />
      </Button>
      <img
        src={src}
        alt=""
        className="max-h-[80vh] max-w-[80vw] rounded-lg object-contain"
        onClick={(event) => event.stopPropagation()}
      />
    </div>,
    document.body
  )
}
