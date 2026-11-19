import { PERMISSIONS } from '#users/enums/permission'
import type User from '#users/models/user'

export type GlobalPermissions = {
  manageUsers: boolean
  manageTokens: boolean
  manageNetworkDrives: boolean
  manageRoles: boolean
  viewLive: boolean
  viewRundowns: boolean
  manageRundowns: boolean
  manageStepTypes: boolean
  manageCompanionServers: boolean
  manageGraphics: boolean
  viewContext: boolean
  editContext: boolean
  manageContext: boolean
  manageTransfer: boolean
}

export const EMPTY_GLOBAL_PERMISSIONS: GlobalPermissions = {
  manageUsers: false,
  manageTokens: false,
  manageNetworkDrives: false,
  manageRoles: false,
  viewLive: false,
  viewRundowns: false,
  manageRundowns: false,
  manageStepTypes: false,
  manageCompanionServers: false,
  manageGraphics: false,
  viewContext: false,
  editContext: false,
  manageContext: false,
  manageTransfer: false,
}

export async function globalPermissions(user: User | undefined): Promise<GlobalPermissions> {
  if (!user) return EMPTY_GLOBAL_PERMISSIONS
  return {
    manageUsers: await user.hasPermission(PERMISSIONS.usersViewList),
    manageTokens: await user.hasPermission(PERMISSIONS.tokensViewList),
    viewLive: await user.hasPermission(PERMISSIONS.liveView),
    viewRundowns: await user.hasPermission(PERMISSIONS.rundownsViewList),
    manageRundowns: await user.hasPermission(PERMISSIONS.rundownsManage),
    manageStepTypes: await user.hasPermission(PERMISSIONS.rundownsManageStepTypes),
    manageCompanionServers: await user.hasPermission(PERMISSIONS.rundownsManageCompanionServers),
    manageGraphics: await user.hasPermission(PERMISSIONS.graphicsManage),
    manageRoles: await user.hasPermission(PERMISSIONS.rolesManage),
    manageNetworkDrives: await user.hasPermission(PERMISSIONS.networkDrivesViewList),
    viewContext: await user.hasPermission(PERMISSIONS.contextView),
    editContext: await user.hasPermission(PERMISSIONS.contextEdit),
    manageContext: await user.hasPermission(PERMISSIONS.contextManage),
    manageTransfer: await user.hasPermission(PERMISSIONS.transferManage),
  }
}
