import { LucideIcon, Shield, User, UserCog } from 'lucide-react'

import { SimpleTFunction } from '#common/ui/hooks/use_translation'

import { ROLES, isSystemRole } from '#users/enums/role'

import type { Data } from '@generated/data'

export type RoleOption = Data.Users.Role.Variants['forOption']

export type Role = {
  label: string
  value: string
  icon?: LucideIcon
}

const SYSTEM_ROLE_ICONS: Record<string, LucideIcon> = {
  [ROLES.ADMIN]: Shield,
  [ROLES.USER]: User,
}

// System roles are translated; custom roles display the name they were given.
export function roleLabel(t: SimpleTFunction, name: string): string {
  return isSystemRole(name) ? t(`users.roles.${name}.name`) : name
}

export function userRoles(t: SimpleTFunction, options: RoleOption[]): Role[] {
  return options.map(({ name }) => ({
    value: name,
    label: roleLabel(t, name),
    icon: SYSTEM_ROLE_ICONS[name] ?? UserCog,
  }))
}
