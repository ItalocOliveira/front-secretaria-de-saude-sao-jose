import { formatDistanceToNowStrict } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  FileTextIcon,
  FileSignatureIcon,
  HistoryIcon,
  LifeBuoyIcon,
  LogInIcon,
  PackageIcon,
  UserCogIcon,
} from "lucide-react"

import type { ActivityLogDto, ActivityLogUser } from "@/api/activity-logs"
import { describeActivity, type ActivityArea } from "@/lib/activity"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"

const AREA_ICON: Record<ActivityArea, typeof HistoryIcon> = {
  acesso: LogInIcon,
  usuarios: UserCogIcon,
  apacs: FileTextIcon,
  oficios: FileSignatureIcon,
  almoxarifado: PackageIcon,
  suporte: LifeBuoyIcon,
}

const FULL_DATE = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" })

function when(createdAt: string) {
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) {
    return { relative: "", absolute: "" }
  }
  return {
    relative: formatDistanceToNowStrict(date, { locale: ptBR, addSuffix: true }),
    absolute: FULL_DATE.format(date),
  }
}

/**
 * Registros de `GET /activity-logs` em frase ("Juliana abriu o PDF de uma APAC"). Com
 * `onUserClick`, o nome de quem fez vira botão para filtrar só as ações dessa pessoa.
 */
export function ActivityLogList({
  logs,
  onUserClick,
}: {
  logs: ActivityLogDto[]
  onUserClick?: (user: ActivityLogUser) => void
}) {
  return (
    <ItemGroup className="gap-2">
      {logs.map((log) => {
        const { actor, actorRole, text, detail, area } = describeActivity(log)
        const Icon = area === null ? HistoryIcon : AREA_ICON[area]
        const time = when(log.created_at)
        const user = log.user

        return (
          <Item key={log.id} variant="muted" size="sm">
            <ItemMedia variant="icon">
              <Icon />
            </ItemMedia>
            <ItemContent className="min-w-0">
              <ItemTitle className="block">
                {user !== null && onUserClick !== undefined ? (
                  <button
                    type="button"
                    className="font-semibold underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
                    title={`Ver só as ações de ${user.name}`}
                    onClick={() => onUserClick(user)}
                  >
                    {actor}
                  </button>
                ) : (
                  <span className="font-semibold">{actor}</span>
                )}{" "}
                <span className="font-normal">{text}</span>
              </ItemTitle>
              {detail === null ? null : <ItemDescription>{detail}</ItemDescription>}
              <ItemDescription>
                <time dateTime={log.created_at} title={time.absolute}>
                  {time.relative}
                </time>
                {actorRole === null ? null : ` · ${actorRole}`}
              </ItemDescription>
            </ItemContent>
          </Item>
        )
      })}
    </ItemGroup>
  )
}
