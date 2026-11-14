import { BasePolicy } from '@adonisjs/bouncer'
import { type AuthorizerResponse } from '@adonisjs/bouncer/types'

import { PERMISSIONS } from '#users/enums/permission'
import type User from '#users/models/user'

export default class LayerPolicy extends BasePolicy {
  async manage(currentUser: User): Promise<AuthorizerResponse> {
    return currentUser.hasPermission(PERMISSIONS.graphicsManage)
  }
}
