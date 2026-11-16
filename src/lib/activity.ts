import type { ActivityLogDto } from "@/api/activity-logs"
import type { SupportActionDetails } from "@/api/notifications"
import { USER_ROLE_LABEL, type UserRole } from "@/lib/apac"
import { describeSupportAction } from "@/lib/support"

/** Ações de `GET /activity-logs` (comunicado 2026-11-16-auditoria-municipio). */
export const ACTIVITY_ACTION = {
  LOGIN: "LOGIN",
  LOGIN_FAILED: "LOGIN_FAILED",
  USER_CREATED: "USER_CREATED",
  USER_DELETED: "USER_DELETED",
  APAC_CREATED: "APAC_CREATED",
  APAC_UPDATED: "APAC_UPDATED",
  APAC_DELETED: "APAC_DELETED",
  APAC_PDF_CONFIRMED: "APAC_PDF_CONFIRMED",
  APAC_PDF_VIEWED: "APAC_PDF_VIEWED",
  DOCUMENT_CREATED: "DOCUMENT_CREATED",
  DOCUMENT_UPDATED: "DOCUMENT_UPDATED",
  DOCUMENT_DELETED: "DOCUMENT_DELETED",
  ITEM_CREATED: "ITEM_CREATED",
  ITEM_UPDATED: "ITEM_UPDATED",
  ITEM_DELETED: "ITEM_DELETED",
  ITEM_IMAGE_CONFIRMED: "ITEM_IMAGE_CONFIRMED",
  ITEM_MOVEMENT: "ITEM_MOVEMENT",
  PLATFORM_TENANT_CREATED: "PLATFORM_TENANT_CREATED",
  PLATFORM_USER_CREATED: "PLATFORM_USER_CREATED",
  PLATFORM_USER_UPDATED: "PLATFORM_USER_UPDATED",
  PLATFORM_USER_PASSWORD_RESET: "PLATFORM_USER_PASSWORD_RESET",
  PLATFORM_USER_DELETED: "PLATFORM_USER_DELETED",
} as const

export type ActivityAction = (typeof ACTIVITY_ACTION)[keyof typeof ACTIVITY_ACTION]

/** Área de cada ação — decide o ícone e agrupa o filtro da tela de auditoria. */
export type ActivityArea = "acesso" | "usuarios" | "apacs" | "oficios" | "almoxarifado" | "suporte"

export const ACTIVITY_AREA_LABEL: Record<ActivityArea, string> = {
  acesso: "Acesso",
  usuarios: "Usuários",
  apacs: "APACs",
  oficios: "Ofícios",
  almoxarifado: "Almoxarifado",
  suporte: "Suporte da plataforma",
}

/** Rótulo curto de cada ação (filtro) e a área a que pertence. Ordem = ordem do filtro. */
export const ACTIVITY_ACTION_META: Record<ActivityAction, { label: string; area: ActivityArea }> = {
  LOGIN: { label: "Entrou no sistema", area: "acesso" },
  LOGIN_FAILED: { label: "Tentativa de acesso falhou", area: "acesso" },
  USER_CREATED: { label: "Criou usuário", area: "usuarios" },
  USER_DELETED: { label: "Excluiu usuário", area: "usuarios" },
  APAC_CREATED: { label: "Cadastrou APAC", area: "apacs" },
  APAC_UPDATED: { label: "Editou APAC", area: "apacs" },
  APAC_DELETED: { label: "Excluiu APAC", area: "apacs" },
  APAC_PDF_CONFIRMED: { label: "Enviou PDF de APAC", area: "apacs" },
  APAC_PDF_VIEWED: { label: "Abriu PDF de APAC", area: "apacs" },
  DOCUMENT_CREATED: { label: "Cadastrou ofício", area: "oficios" },
  DOCUMENT_UPDATED: { label: "Editou ofício", area: "oficios" },
  DOCUMENT_DELETED: { label: "Excluiu ofício", area: "oficios" },
  ITEM_CREATED: { label: "Cadastrou item", area: "almoxarifado" },
  ITEM_UPDATED: { label: "Editou item", area: "almoxarifado" },
  ITEM_DELETED: { label: "Excluiu item", area: "almoxarifado" },
  ITEM_IMAGE_CONFIRMED: { label: "Enviou foto de item", area: "almoxarifado" },
  ITEM_MOVEMENT: { label: "Registrou entrada/saída", area: "almoxarifado" },
  PLATFORM_TENANT_CREATED: { label: "Cadastrou o município", area: "suporte" },
  PLATFORM_USER_CREATED: { label: "Criou usuário", area: "suporte" },
  PLATFORM_USER_UPDATED: { label: "Alterou usuário", area: "suporte" },
  PLATFORM_USER_PASSWORD_RESET: { label: "Redefiniu senha", area: "suporte" },
  PLATFORM_USER_DELETED: { label: "Excluiu usuário", area: "suporte" },
}

export const ACTIVITY_ACTION_LIST = Object.keys(ACTIVITY_ACTION_META) as ActivityAction[]

export function isActivityAction(value: string): value is ActivityAction {
  return value in ACTIVITY_ACTION_META
}

/** Campos editáveis da APAC (`PATCH /apacs/:id`) — `APAC_UPDATED` traz só os nomes deles. */
const APAC_FIELD_LABEL: Record<string, string> = {
  name: "nome",
  acs: "ACS",
  procedure: "procedimento",
  municipality: "município",
  status: "status",
}

const text = (value: unknown) => (typeof value === "string" && value.trim() !== "" ? value : null)

function roleLabel(value: unknown) {
  const role = text(value)
  return role === null ? null : (USER_ROLE_LABEL[role as UserRole] ?? role)
}

/** `APAC_UPDATED`: os nomes dos campos podem vir como lista em `details` ou em `details.fields`. */
function changedFields(details: Record<string, unknown>) {
  const raw = Array.isArray(details.fields) ? details.fields : Array.isArray(details) ? details : Object.keys(details)
  const fields = raw.filter((field): field is string => typeof field === "string")
  return fields.length === 0 ? null : `Campos: ${fields.map((field) => APAC_FIELD_LABEL[field] ?? field).join(", ")}`
}

export type ActivityDescription = {
  /** Quem fez: nome do usuário, autor da plataforma ou um texto neutro. */
  actor: string
  /** Cargo de quem fez, quando há usuário. */
  actorRole: string | null
  /** O que foi feito, já em frase ("abriu o PDF de uma APAC"). */
  text: string
  /** Complemento (campos alterados, cargo do usuário criado…). */
  detail: string | null
  area: ActivityArea | null
}

/**
 * Frase de um registro de atividade. Os alvos (APAC, ofício, item) vêm só como id — a rota não traz
 * nome de paciente, e o front não busca por id —, então a frase fala em "uma APAC", "um ofício".
 */
export function describeActivity(log: ActivityLogDto): ActivityDescription {
  const details = log.details ?? {}
  const area = isActivityAction(log.action) ? ACTIVITY_ACTION_META[log.action].area : null

  if (log.action.startsWith("PLATFORM_")) {
    // Mesmo formato de `details` das ações de suporte do `GET /notifications`: o complemento
    // (o que mudou, motivo) vem de lá; a frase aqui é com verbo, porque o autor vem antes.
    const support = describeSupportAction({ ...log, details: details as SupportActionDetails })
    const userName = text(details.userName) ?? text(details.name) ?? "um usuário"
    const created = roleLabel(details.role)
    const platformText: Record<string, string> = {
      PLATFORM_TENANT_CREATED: "cadastrou o município na plataforma",
      PLATFORM_USER_CREATED: `criou o usuário ${userName}`,
      PLATFORM_USER_UPDATED: `alterou os dados de ${userName}`,
      PLATFORM_USER_PASSWORD_RESET: `redefiniu a senha de ${userName}`,
      PLATFORM_USER_DELETED: `excluiu o usuário ${userName}`,
    }
    return {
      actor: text(details.platformAdmin) ?? "Suporte da plataforma",
      actorRole: "Suporte da plataforma",
      text: platformText[log.action] ?? support.title,
      detail:
        log.action === ACTIVITY_ACTION.PLATFORM_USER_CREATED && created !== null ? `Cargo: ${created}` : support.detail,
      area: "suporte",
    }
  }

  const actor =
    log.user?.name ??
    (log.action === ACTIVITY_ACTION.LOGIN_FAILED
      ? "CPF não cadastrado"
      : text(details.deletedUserId) === null
        ? "Usuário desconhecido"
        : "Usuário excluído")
  const actorRole = log.user === null ? null : (USER_ROLE_LABEL[log.user.role] ?? log.user.role)
  const name = text(details.name)
  const createdRole = roleLabel(details.role)

  const base = { actor, actorRole, area }

  switch (log.action) {
    case ACTIVITY_ACTION.LOGIN:
      return { ...base, text: "entrou no sistema", detail: null }
    case ACTIVITY_ACTION.LOGIN_FAILED:
      return { ...base, text: "tentou entrar no sistema, sem sucesso", detail: null }
    case ACTIVITY_ACTION.USER_CREATED:
      return {
        ...base,
        text: name === null ? "criou um usuário" : `criou o usuário ${name}`,
        detail: createdRole === null ? null : `Cargo: ${createdRole}`,
      }
    case ACTIVITY_ACTION.USER_DELETED:
      return {
        ...base,
        text: name === null ? "excluiu um usuário" : `excluiu o usuário ${name}`,
        detail: createdRole === null ? null : `Cargo: ${createdRole}`,
      }
    case ACTIVITY_ACTION.APAC_CREATED:
      return { ...base, text: "cadastrou uma APAC", detail: null }
    case ACTIVITY_ACTION.APAC_UPDATED:
      return { ...base, text: "editou uma APAC", detail: changedFields(details) }
    case ACTIVITY_ACTION.APAC_DELETED:
      return { ...base, text: "excluiu uma APAC", detail: null }
    case ACTIVITY_ACTION.APAC_PDF_CONFIRMED:
      return { ...base, text: "enviou o PDF de uma APAC", detail: null }
    case ACTIVITY_ACTION.APAC_PDF_VIEWED:
      return { ...base, text: "abriu o PDF de uma APAC", detail: null }
    case ACTIVITY_ACTION.DOCUMENT_CREATED:
      return { ...base, text: "cadastrou um ofício", detail: null }
    case ACTIVITY_ACTION.DOCUMENT_UPDATED:
      return { ...base, text: "editou um ofício", detail: null }
    case ACTIVITY_ACTION.DOCUMENT_DELETED:
      return { ...base, text: "excluiu um ofício", detail: null }
    case ACTIVITY_ACTION.ITEM_CREATED:
      return { ...base, text: name === null ? "cadastrou um item" : `cadastrou o item ${name}`, detail: null }
    case ACTIVITY_ACTION.ITEM_UPDATED:
      return { ...base, text: name === null ? "editou um item" : `editou o item ${name}`, detail: null }
    case ACTIVITY_ACTION.ITEM_DELETED:
      return { ...base, text: name === null ? "excluiu um item" : `excluiu o item ${name}`, detail: null }
    case ACTIVITY_ACTION.ITEM_IMAGE_CONFIRMED:
      return { ...base, text: "enviou a foto de um item", detail: null }
    case ACTIVITY_ACTION.ITEM_MOVEMENT:
      return { ...base, text: "registrou uma entrada/saída no almoxarifado", detail: null }
    default:
      return { ...base, text: log.action, detail: null }
  }
}
