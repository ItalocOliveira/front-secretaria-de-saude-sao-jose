/**
 * Matriz de permissões do frontend — espelha `.docs/api-backend.md`.
 *
 * A API é a autoridade (responde 403); isto existe para a UI esconder o que o
 * perfil não pode fazer, em vez de deixar o usuário bater na parede.
 */

import type { UserRole } from "@/lib/apac"

/** Roles com acesso a `/apacs` (listar e criar). */
export const APAC_ROLES: readonly UserRole[] = ["DEV", "DIRETOR", "RECEPCIONISTA", "REGULADOR"]

/** Roles com acesso a `/users` (listar e criar). `COORDENADOR` tem as mesmas permissões de `SECRETARIO`. */
export const USER_MANAGEMENT_ROLES: readonly UserRole[] = ["DEV", "DIRETOR", "SECRETARIO", "COORDENADOR"]

/** Roles com acesso a `/itens` (almoxarifado). */
export const ITEM_ROLES: readonly UserRole[] = ["DEV", "DIRETOR", "REGULADOR"]

/** Roles com acesso a `/documents` (ofícios). Por enquanto só `DEV` — outras roles recebem 403 da API. */
export const DOCUMENT_ROLES: readonly UserRole[] = ["DEV"]

/**
 * Roles que podem chamar `DELETE /documents/:id` (apaga o registro **e** o PDF no bucket).
 * Separado de `DOCUMENT_ROLES` de propósito: se a tela de ofícios for liberada para
 * outros perfis, a exclusão continua restrita a `DEV` sem mudar nada aqui.
 */
export const DOCUMENT_DELETE_ROLES: readonly UserRole[] = ["DEV"]

/**
 * Roles com acesso a `POST /reports/apacs` (relatórios) — todos os perfis.
 */
export const REPORT_ROLES: readonly UserRole[] = [
  "DEV",
  "SECRETARIO",
  "DIRETOR",
  "RECEPCIONISTA",
  "REGULADOR",
  "COORDENADOR",
]

export function canAccessApacs(role: UserRole) {
  return APAC_ROLES.includes(role)
}

export function canManageUsers(role: UserRole) {
  return USER_MANAGEMENT_ROLES.includes(role)
}

export function canAccessItens(role: UserRole) {
  return ITEM_ROLES.includes(role)
}

export function canAccessDocuments(role: UserRole) {
  return DOCUMENT_ROLES.includes(role)
}

export function canDeleteDocuments(role: UserRole) {
  return DOCUMENT_DELETE_ROLES.includes(role)
}

export function canAccessReports(role: UserRole) {
  return REPORT_ROLES.includes(role)
}

/**
 * Primeira rota que o perfil consegue abrir.
 *
 * `SECRETARIO`/`COORDENADOR` não enxergam APACs e `RECEPCIONISTA`/`REGULADOR`
 * não enxergam usuários, então não existe uma home única para todo mundo.
 * `/relatorios` é o último recurso, para um perfil que não alcance nenhum dos dois.
 */
export function homeRouteFor(role: UserRole) {
  if (canAccessApacs(role)) {
    return "/apacs"
  }

  return canManageUsers(role) ? "/usuarios" : "/relatorios"
}

/**
 * Para onde mandar o usuário depois do login.
 *
 * Respeita o destino que ele tentou abrir antes de ser barrado, mas só se o
 * perfil alcançar aquela área — senão ele cairia direto na tela de acesso negado.
 */
export function resolveDestination(from: string | undefined, role: UserRole) {
  const home = homeRouteFor(role)

  if (from === undefined) {
    return home
  }

  if (from.startsWith("/apacs")) {
    return canAccessApacs(role) ? from : home
  }

  if (from.startsWith("/usuarios")) {
    return canManageUsers(role) ? from : home
  }

  if (from.startsWith("/almoxarifado")) {
    return canAccessItens(role) ? from : home
  }

  if (from.startsWith("/documents")) {
    return canAccessDocuments(role) ? from : home
  }

  if (from.startsWith("/relatorios")) {
    return canAccessReports(role) ? from : home
  }

  return home
}
