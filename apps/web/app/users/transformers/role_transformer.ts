import { BaseTransformer } from '@adonisjs/core/transformers'

import { isSystemRole } from '#users/enums/role'
import type Role from '#users/models/role'

export default class RoleTransformer extends BaseTransformer<Role> {
  toObject() {
    return {
      id: this.resource.id,
      name: this.resource.name,
    }
  }

  forOption() {
    return this.toObject()
  }

  forList() {
    return {
      ...this.toObject(),
      permissions: this.resource.effectivePermissions,
      isSystem: isSystemRole(this.resource.name),
      usersCount: Number(this.resource.$extras.users_count ?? 0),
    }
  }

  forEdit() {
    return {
      ...this.toObject(),
      permissions: this.resource.effectivePermissions,
      isSystem: isSystemRole(this.resource.name),
    }
  }
}
