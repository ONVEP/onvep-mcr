import { BasePolicy } from '@adonisjs/bouncer'
import { type AuthorizerResponse } from '@adonisjs/bouncer/types'

import { PERMISSIONS } from '#users/enums/permission'
import type User from '#users/models/user'

export default class ContextPolicy extends BasePolicy {
  async view(currentUser: User): Promise<AuthorizerResponse> {
    return currentUser.hasPermission(PERMISSIONS.contextView)
  }

  async edit(currentUser: User): Promise<AuthorizerResponse> {
    return currentUser.hasPermission(PERMISSIONS.contextEdit)
  }

  /** Mutators and validators: code and schemas that run on every update */
  async manage(currentUser: User): Promise<AuthorizerResponse> {
    return currentUser.hasPermission(PERMISSIONS.contextManage)
  }
}
