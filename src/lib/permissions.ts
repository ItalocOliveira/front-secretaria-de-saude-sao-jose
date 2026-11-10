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

/** Todos os cargos. `RECEPCIONISTA` é o único com acesso parcial. */
const ALL_ROLES: readonly UserRole[] = ["DEV", "DIRETOR", "SECRETARIO", "REGULADOR", "COORDENADOR", "RECEPCIONISTA"]

/** Todos, exceto `RECEPCIONISTA` (almoxarifado e documentos). */
const ALL_EXCEPT_RECEPCIONISTA: readonly UserRole[] = ["DEV", "DIRETOR", "SECRETARIO", "REGULADOR", "COORDENADOR"]

/** Roles com acesso a `/apacs` (criar, listar, editar, excluir). */
export const APAC_ROLES = ALL_ROLES

/** Roles com acesso a `/users` (listar e criar). */
export const USER_MANAGEMENT_ROLES = ALL_ROLES

/** Roles com acesso a `/itens` (almoxarifado). */
export const ITEM_ROLES = ALL_EXCEPT_RECEPCIONISTA

/** Roles com acesso a `/documents` (ofícios). */
export const DOCUMENT_ROLES = ALL_EXCEPT_RECEPCIONISTA

/**
 * Roles que podem chamar `DELETE /documents/:id` (apaga o registro **e** o PDF no bucket).
 * Hoje é igual a `DOCUMENT_ROLES` (na API, cada módulo libera todas as suas rotas), mas
 * fica separado para a exclusão poder ser restringida sem mexer no acesso à tela.
 */
export const DOCUMENT_DELETE_ROLES = DOCUMENT_ROLES

/** Roles com acesso a `POST /reports/apacs` (relatórios). */
export const REPORT_ROLES = ALL_ROLES

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
