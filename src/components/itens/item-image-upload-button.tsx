import { useRef, type ChangeEvent, type ComponentProps } from "react"
import { ImagePlusIcon } from "lucide-react"

import type { ItemDto } from "@/api/itens"
import { ITEM_IMAGE_MIME_ACCEPT, isImageFile } from "@/lib/itens"
import { useAttachItemImage } from "@/hooks/use-itens"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"

/**
 * "Adicionar imagem" / "Trocar imagem" de um item já cadastrado. A foto é enviada assim que
 * escolhida (`upload-url` → `PUT` no R2 → `confirm`); o resultado sai em toast, e a listagem é
 * recarregada para trazer o `image_url` novo.
 */
export function ItemImageUploadButton({
  item,
  disabled,
  ...buttonProps
}: { item: ItemDto } & Omit<ComponentProps<typeof Button>, "onClick" | "children">) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { mutate: attachImage, isPending } = useAttachItemImage()

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    event.target.value = ""
    if (file === null) {
      return
    }
    if (!isImageFile(file)) {
      toast.add({ title: "Arquivo inválido", description: "Selecione uma imagem." })
      return
    }

    const replacing = item.has_image
    attachImage(
      { id: item.id, file },
      {
        onSuccess: () =>
          toast.add({
            title: replacing ? "Imagem trocada" : "Imagem adicionada",
            description: `Foto de ${item.name} enviada com sucesso.`,
          }),
        onError: (error) => toast.add({ title: "Não foi possível enviar a imagem", description: error.message }),
      }
    )
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        {...buttonProps}
        disabled={disabled || isPending}
        onClick={() => inputRef.current?.click()}
      >
        {isPending ? <Spinner data-icon="inline-start" /> : <ImagePlusIcon data-icon="inline-start" />}
        {isPending ? "Enviando…" : item.has_image ? "Trocar imagem" : "Adicionar imagem"}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={ITEM_IMAGE_MIME_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        disabled={disabled || isPending}
        onChange={handleChange}
      />
    </>
  )
}
