export const PERMISSIONS = {
  usersViewList: 'users.view_list',
  usersCreate: 'users.create',
  usersUpdate: 'users.update',
  usersDelete: 'users.delete',
  usersInvite: 'users.invite',
  usersImpersonate: 'users.impersonate',
  usersManageRoles: 'users.manage_roles',
  rolesManage: 'roles.manage',
  tokensViewList: 'tokens.view_list',
  tokensCreate: 'tokens.create',
  tokensDelete: 'tokens.delete',
  liveView: 'live.view',
  rundownsViewList: 'rundowns.view_list',
  rundownsManage: 'rundowns.manage',
  rundownsManageStepTypes: 'rundowns.manage_step_types',
  graphicsManage: 'graphics.manage',
  networkDrivesViewList: 'network_drives.view_list',
  networkDrivesCreate: 'network_drives.create',
  networkDrivesUpdate: 'network_drives.update',
  networkDrivesDelete: 'network_drives.delete',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

const PERMISSION_VALUES = new Set<string>(Object.values(PERMISSIONS))

export function isPermission(value: string): value is Permission {
  return PERMISSION_VALUES.has(value)
}

export const ALL_PERMISSIONS = Object.values(PERMISSIONS) as Permission[]
