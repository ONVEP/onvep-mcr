import { BasePolicy } from '@adonisjs/bouncer'
import { type AuthorizerResponse } from '@adonisjs/bouncer/types'

import { PERMISSIONS, type Permission } from '#users/enums/permission'
import type User from '#users/models/user'
import type { TransferNodeId } from '#transfer/types/bundle'

// Exporting or importing a node is managing it: it takes the permission of the screen that edits it.
const NODE_PERMISSIONS: Record<TransferNodeId, Permission> = {
  'rundowns.stepTypes': PERMISSIONS.rundownsManageStepTypes,
  'rundowns.rundowns': PERMISSIONS.rundownsManage,
  // The export carries the passwords in clear.
  'media.networkDrives': PERMISSIONS.networkDrivesUpdate,
  'graphics.layers': PERMISSIONS.graphicsManage,
  'graphics.cssVariables': PERMISSIONS.graphicsManage,
  'graphics.customCss': PERMISSIONS.graphicsManage,
  'context.data': PERMISSIONS.contextManage,
  'context.mutators': PERMISSIONS.contextManage,
  'context.validators': PERMISSIONS.contextManage,
  'users.roles': PERMISSIONS.rolesManage,
}

export default class TransferPolicy extends BasePolicy {
  async manage(currentUser: User): Promise<AuthorizerResponse> {
    return currentUser.hasPermission(PERMISSIONS.transferManage)
  }

  async useNode(currentUser: User, node: TransferNodeId): Promise<AuthorizerResponse> {
    return currentUser.hasPermission(NODE_PERMISSIONS[node])
  }
}
