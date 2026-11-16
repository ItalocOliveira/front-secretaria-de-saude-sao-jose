import type { SupportActionDto, SupportChange } from "@/api/notifications"
import { USER_ROLE_LABEL, type UserRole } from "@/lib/apac"

/** Ações da plataforma que o `GET /notifications` devolve em `support.items`. */
export const SUPPORT_ACTION = {
  TENANT_CREATED: "PLATFORM_TENANT_CREATED",
  USER_CREATED: "PLATFORM_USER_CREATED",
  USER_UPDATED: "PLATFORM_USER_UPDATED",
  PASSWORD_RESET: "PLATFORM_USER_PASSWORD_RESET",
  USER_DELETED: "PLATFORM_USER_DELETED",
} as const

/** Cargo desconhecido aparece cru em vez de sumir. */
function roleLabel(role: string) {
  return USER_ROLE_LABEL[role as UserRole] ?? role
}

function isChange(value: unknown): value is SupportChange {
  return typeof value === "object" && value !== null && "from" in value && "to" in value
}

/** Texto curto da ação e, quando houver, o detalhe do que mudou. */
export function describeSupportAction(item: SupportActionDto): { title: string; detail: string | null } {
  const details = item.details ?? {}
  const userName = details.userName ?? (typeof details.name === "string" ? details.name : "usuário")

  switch (item.action) {
    case SUPPORT_ACTION.TENANT_CREATED:
      return { title: "Município cadastrado na plataforma", detail: null }
    case SUPPORT_ACTION.USER_CREATED:
      return {
        title: `Usuário ${userName} criado`,
        detail: typeof details.role === "string" ? `Cargo: ${roleLabel(details.role)}` : null,
      }
    case SUPPORT_ACTION.USER_UPDATED: {
      const changes: string[] = []
      if (isChange(details.name)) {
        changes.push(`Nome: ${details.name.from} → ${details.name.to}`)
      }
      if (isChange(details.role)) {
        changes.push(`Cargo: ${roleLabel(details.role.from)} → ${roleLabel(details.role.to)}`)
      }
      return { title: `Dados de ${userName} alterados`, detail: changes.length > 0 ? changes.join(" · ") : null }
    }
    case SUPPORT_ACTION.PASSWORD_RESET:
      return { title: `Senha de ${userName} redefinida`, detail: null }
    case SUPPORT_ACTION.USER_DELETED:
      return {
        title: `Usuário ${userName} excluído`,
        detail: details.reason === undefined ? null : `Motivo: ${details.reason}`,
      }
    default:
      return { title: item.action, detail: null }
  }
}
