/**
 * Matriz de permissões do frontend — espelha `.docs/temp/PERMISSOES.md` (que por sua
 * vez espelha as listas de cargos nos controllers da API).
 *
 * A API é a autoridade (responde 403); isto existe para a UI esconder o que o
 * perfil não pode fazer, em vez de deixar o usuário bater na parede.
 *
 * As listas são explícitas de propósito, como na API: um cargo novo não ganha
 * acesso a nada sozinho, precisa ser incluído em cada lista que deve liberá-lo.
 */

import type { UserRole } from "@/lib/apac"

/** Todos os cargos. */
const ALL_ROLES: readonly UserRole[] = ["DEV", "DIRETOR", "SECRETARIO", "REGULADOR", "COORDENADOR", "RECEPCIONISTA"]

/** Cargos com acesso a todos os endpoints. `RECEPCIONISTA` é o único fora daqui. */
const FULL_ACCESS_ROLES: readonly UserRole[] = ["DEV", "DIRETOR", "SECRETARIO", "REGULADOR", "COORDENADOR"]

/** Roles com acesso à tela de APACs: `POST /apacs`, `GET /apacs` e `PATCH /apacs/:id`. */
export const APAC_ROLES = ALL_ROLES

/** Roles que podem chamar `DELETE /apacs/:id` (`RECEPCIONISTA` cria, lista e edita, mas não exclui). */
export const APAC_DELETE_ROLES = FULL_ACCESS_ROLES

/** Roles com acesso a `/users` (listar e criar). */
export const USER_MANAGEMENT_ROLES = FULL_ACCESS_ROLES

/** Roles com acesso a `/itens` (almoxarifado). */
export const ITEM_ROLES = FULL_ACCESS_ROLES

/** Roles com acesso à tela de ofícios — basta `POST /documents` (criar). */
export const DOCUMENT_ROLES = ALL_ROLES

/**
 * Roles que podem listar e editar ofícios (`GET /documents`, `PATCH /documents/:id`).
 * `RECEPCIONISTA` só cria: a tela mostra apenas o formulário.
 */
export const DOCUMENT_MANAGE_ROLES = FULL_ACCESS_ROLES

/** Roles que podem chamar `DELETE /documents/:id` (apaga o registro **e** o PDF no bucket). */
export const DOCUMENT_DELETE_ROLES = FULL_ACCESS_ROLES

/** Roles com acesso a `POST /reports/apacs` (relatórios). */
export const REPORT_ROLES = ALL_ROLES

export function canAccessApacs(role: UserRole) {
  return APAC_ROLES.includes(role)
}

export function canDeleteApacs(role: UserRole) {
  return APAC_DELETE_ROLES.includes(role)
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

export function canManageDocuments(role: UserRole) {
  return DOCUMENT_MANAGE_ROLES.includes(role)
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
 * Hoje todos os cargos acessam APACs, então todo mundo cai em `/apacs`. Os demais
 * ramos ficam como rede de segurança caso a matriz volte a ter cargos sem APACs.
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

/**
 * Cargos que o perfil pode atribuir em `POST /users`. Hoje só `DEV` cria `DEV` — para os
 * demais a API responde `403` ("Seu cargo não pode criar usuários com o cargo DEV.").
 */
export function creatableRolesFor(role: UserRole): readonly UserRole[] {
  return role === "DEV" ? ALL_ROLES : ALL_ROLES.filter((candidate) => candidate !== "DEV")
}
