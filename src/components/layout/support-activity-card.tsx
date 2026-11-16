import { formatDistanceToNowStrict } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Building2Icon, KeyRoundIcon, LifeBuoyIcon, UserCogIcon, UserPlusIcon } from "lucide-react"

import type { SupportActivityDto } from "@/api/notifications"
import { describeSupportAction, SUPPORT_ACTION } from "@/lib/support"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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

/**
 * `support` de `GET /notifications`: o que a equipe da plataforma fez no município (criar usuário,
 * trocar nome/cargo, redefinir senha). Só `SECRETARIO`/`DIRETOR` recebem. Fica fora do sino (não
 * entra no `total`) e não tem "marcar como lida" — cada ação some sozinha depois de `days` dias.
 */
export function SupportActivityCard({ support }: { support: SupportActivityDto }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ações do suporte</CardTitle>
        <CardDescription>
          Alterações feitas pela equipe da plataforma neste município nos últimos {support.days} dias.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ItemGroup className="gap-2">
          {support.items.map((item) => {
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
      </CardContent>

      {support.count > support.items.length ? (
        <CardFooter className="text-[0.8125rem] text-muted-foreground">
          Mostrando {support.items.length} de {support.count} ações.
        </CardFooter>
      ) : null}
    </Card>
  )
}
