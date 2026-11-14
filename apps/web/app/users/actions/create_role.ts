import type { Permission } from '#users/enums/permission'
import Role from '#users/models/role'

export interface CreateRoleInput {
  name: string
  permissions: Permission[]
}

export default class CreateRole {
  async handle(input: CreateRoleInput): Promise<Role> {
    return Role.create({ name: input.name, permissions: input.permissions })
  }
}
