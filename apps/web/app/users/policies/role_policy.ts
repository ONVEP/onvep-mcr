import { BasePolicy } from '@adonisjs/bouncer'
import { type AuthorizerResponse } from '@adonisjs/bouncer/types'

import { PERMISSIONS } from '#users/enums/permission'
import { ROLES, isSystemRole } from '#users/enums/role'
import type Role from '#users/models/role'
import type User from '#users/models/user'

export default class RolePolicy extends BasePolicy {
  async viewList(currentUser: User): Promise<AuthorizerResponse> {
    return currentUser.hasPermission(PERMISSIONS.rolesManage)
  }

  async create(currentUser: User): Promise<AuthorizerResponse> {
    return currentUser.hasPermission(PERMISSIONS.rolesManage)
  }

  // Admin always holds every permission — editing it could only lock everyone out.
  async update(currentUser: User, role: Role): Promise<AuthorizerResponse> {
    if (role.name === ROLES.ADMIN) return false
    return currentUser.hasPermission(PERMISSIONS.rolesManage)
  }

  // System roles are referenced by name in code; assigned roles would orphan their users.
  async delete(currentUser: User, role: Role, usersCount: number): Promise<AuthorizerResponse> {
    if (isSystemRole(role.name) || usersCount > 0) return false
    return currentUser.hasPermission(PERMISSIONS.rolesManage)
  }
}
