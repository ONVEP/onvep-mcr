import type { Permission } from '#users/enums/permission'
import { isSystemRole } from '#users/enums/role'
import type Role from '#users/models/role'

export interface UpdateRoleInput {
  target: Role
  name: string
  permissions: Permission[]
}

export default class UpdateRole {
  async handle(input: UpdateRoleInput): Promise<Role> {
    input.target.merge({
      // System role names are referenced in code (seeders, escalation guards).
      name: isSystemRole(input.target.name) ? input.target.name : input.name,
      permissions: Array.from(new Set(input.permissions)),
    })
    await input.target.save()

    return input.target
  }
}
