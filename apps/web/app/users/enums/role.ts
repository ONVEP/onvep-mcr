export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

const ROLE_WEIGHTS: Record<Role, number> = {
  admin: 20,
  user: 10,
}

// Custom roles created from the roles page rank between user and admin.
const CUSTOM_ROLE_WEIGHT = 15

const SYSTEM_ROLES = new Set<string>(Object.values(ROLES))

export function isSystemRole(role: string): role is Role {
  return SYSTEM_ROLES.has(role)
}

function weight(role: string): number {
  return isSystemRole(role) ? ROLE_WEIGHTS[role] : CUSTOM_ROLE_WEIGHT
}

export function mainRole(roles: string[]): string | null {
  if (roles.length === 0) return null
  return roles.reduce((top, role) => (weight(role) > weight(top) ? role : top))
}
