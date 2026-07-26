/**
 * Matriz de permissões do frontend — espelha `.docs/api-backend.md`.
 *
 * A API é a autoridade (responde 403); isto existe para a UI esconder o que o
 * perfil não pode fazer, em vez de deixar o usuário bater na parede.
 */

import type { UserRole } from "@/lib/apac"

/** Roles com acesso a `/apecs` (listar e criar). */
export const APAC_ROLES: readonly UserRole[] = ["DEV", "DIRETOR", "RECEPCIONISTA", "REGULADOR"]

/** Roles com acesso a `/users` (listar e criar). */
export const USER_MANAGEMENT_ROLES: readonly UserRole[] = ["DEV", "DIRETOR", "SECRETARIA"]

export function canAccessApacs(role: UserRole) {
  return APAC_ROLES.includes(role)
}

export function canManageUsers(role: UserRole) {
  return USER_MANAGEMENT_ROLES.includes(role)
}

/**
 * Primeira rota que o perfil consegue abrir.
 *
 * `SECRETARIA` não enxerga APACs e `RECEPCIONISTA`/`REGULADOR` não enxergam
 * usuários, então não existe uma home única para todo mundo.
 */
export function homeRouteFor(role: UserRole) {
  return canAccessApacs(role) ? "/apacs" : "/usuarios"
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

  return home
}
