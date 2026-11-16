import { formatDistanceToNowStrict } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Building2Icon, KeyRoundIcon, LifeBuoyIcon, UserCogIcon, UserPlusIcon } from "lucide-react"

import type { SupportActionDto } from "@/api/notifications"
import { describeSupportAction, SUPPORT_ACTION } from "@/lib/support"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"

const ACTION_ICON: Record<string, typeof LifeBuoyIcon> = {
  [SUPPORT_ACTION.TENANT_CREATED]: Building2Icon,
  [SUPPORT_ACTION.USER_CREATED]: UserPlusIcon,
  [SUPPORT_ACTION.USER_UPDATED]: UserCogIcon,
  [SUPPORT_ACTION.PASSWORD_RESET]: KeyRoundIcon,
}

function timeAgo(createdAt: string) {
  const date = new Date(createdAt)
  return Number.isNaN(date.getTime()) ? "" : formatDistanceToNowStrict(date, { locale: ptBR, addSuffix: true })
}

/** Ações da plataforma no município (`support.items` de `GET /notifications`), mais recentes primeiro. */
export function SupportActivityList({ items }: { items: SupportActionDto[] }) {
  return (
    <ItemGroup className="gap-2">
      {items.map((item) => {
        const { title, detail } = describeSupportAction(item)
        const Icon = ACTION_ICON[item.action] ?? LifeBuoyIcon
        const by = item.details?.platformAdmin
        const meta = [timeAgo(item.created_at), by === undefined ? "" : `por ${by}`]
          .filter((part) => part !== "")
          .join(" · ")

        return (
          <Item key={item.id} variant="muted" size="sm">
            <ItemMedia variant="icon">
              <Icon />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{title}</ItemTitle>
              {detail === null ? null : <ItemDescription>{detail}</ItemDescription>}
              <ItemDescription>{meta}</ItemDescription>
            </ItemContent>
          </Item>
        )
      })}
    </ItemGroup>
  )
}
