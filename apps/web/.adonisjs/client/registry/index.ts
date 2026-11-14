/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

export type { Route, Path } from './schema.d.ts'

const placeholder: any = {}

const routes = {
  'drive.fs.serve': {
    methods: ["GET","HEAD"],
    pattern: '/uploads/*',
    tokens: [[0,"uploads"],[2,"*"]],
    types: placeholder as Registry['drive.fs.serve']['types'],
  },
  'marketing.show': {
    methods: ["GET","HEAD"],
    pattern: '/',
    tokens: [[0,"/"]],
    types: placeholder as Registry['marketing.show']['types'],
  },
  'auth.sign_in.show': {
    methods: ["GET","HEAD"],
    pattern: '/login',
    tokens: [[0,"login"]],
    types: placeholder as Registry['auth.sign_in.show']['types'],
  },
  'auth.sign_in.handle': {
    methods: ["POST"],
    pattern: '/login',
    tokens: [[0,"login"]],
    types: placeholder as Registry['auth.sign_in.handle']['types'],
  },
  'auth.sign_out.handle': {
    methods: ["POST"],
    pattern: '/logout',
    tokens: [[0,"logout"]],
    types: placeholder as Registry['auth.sign_out.handle']['types'],
  },
  'auth.forgot_password.show': {
    methods: ["GET","HEAD"],
    pattern: '/forgot-password',
    tokens: [[0,"forgot-password"]],
    types: placeholder as Registry['auth.forgot_password.show']['types'],
  },
  'auth.forgot_password.handle': {
    methods: ["POST"],
    pattern: '/forgot-password',
    tokens: [[0,"forgot-password"]],
    types: placeholder as Registry['auth.forgot_password.handle']['types'],
  },
  'auth.reset_password.show': {
    methods: ["GET","HEAD"],
    pattern: '/reset-password/:token',
    tokens: [[0,"reset-password"],[1,"token"]],
    types: placeholder as Registry['auth.reset_password.show']['types'],
  },
  'auth.reset_password.handle': {
    methods: ["POST"],
    pattern: '/reset-password/:token',
    tokens: [[0,"reset-password"],[1,"token"]],
    types: placeholder as Registry['auth.reset_password.handle']['types'],
  },
  'locale.switch': {
    methods: ["POST"],
    pattern: '/switch/:locale',
    tokens: [[0,"switch"],[1,"locale"]],
    types: placeholder as Registry['locale.switch']['types'],
  },
  'users.invite.show': {
    methods: ["GET","HEAD"],
    pattern: '/users/invite',
    tokens: [[0,"users"],[0,"invite"]],
    types: placeholder as Registry['users.invite.show']['types'],
  },
  'users.invite.handle': {
    methods: ["POST"],
    pattern: '/users/invite',
    tokens: [[0,"users"],[0,"invite"]],
    types: placeholder as Registry['users.invite.handle']['types'],
  },
  'users.impersonate.handle': {
    methods: ["POST"],
    pattern: '/users/impersonate/:id',
    tokens: [[0,"users"],[0,"impersonate"],[1,"id"]],
    types: placeholder as Registry['users.impersonate.handle']['types'],
  },
  'users.index': {
    methods: ["GET","HEAD"],
    pattern: '/users',
    tokens: [[0,"users"]],
    types: placeholder as Registry['users.index']['types'],
  },
  'users.create': {
    methods: ["GET","HEAD"],
    pattern: '/users/create',
    tokens: [[0,"users"],[0,"create"]],
    types: placeholder as Registry['users.create']['types'],
  },
  'users.store': {
    methods: ["POST"],
    pattern: '/users',
    tokens: [[0,"users"]],
    types: placeholder as Registry['users.store']['types'],
  },
  'users.edit': {
    methods: ["GET","HEAD"],
    pattern: '/users/:id/edit',
    tokens: [[0,"users"],[1,"id"],[0,"edit"]],
    types: placeholder as Registry['users.edit']['types'],
  },
  'users.update': {
    methods: ["PUT","PATCH"],
    pattern: '/users/:id',
    tokens: [[0,"users"],[1,"id"]],
    types: placeholder as Registry['users.update']['types'],
  },
  'users.destroy': {
    methods: ["DELETE"],
    pattern: '/users/:id',
    tokens: [[0,"users"],[1,"id"]],
    types: placeholder as Registry['users.destroy']['types'],
  },
  'roles.index': {
    methods: ["GET","HEAD"],
    pattern: '/roles',
    tokens: [[0,"roles"]],
    types: placeholder as Registry['roles.index']['types'],
  },
  'roles.create': {
    methods: ["GET","HEAD"],
    pattern: '/roles/create',
    tokens: [[0,"roles"],[0,"create"]],
    types: placeholder as Registry['roles.create']['types'],
  },
  'roles.store': {
    methods: ["POST"],
    pattern: '/roles',
    tokens: [[0,"roles"]],
    types: placeholder as Registry['roles.store']['types'],
  },
  'roles.edit': {
    methods: ["GET","HEAD"],
    pattern: '/roles/:id/edit',
    tokens: [[0,"roles"],[1,"id"],[0,"edit"]],
    types: placeholder as Registry['roles.edit']['types'],
  },
  'roles.update': {
    methods: ["PUT","PATCH"],
    pattern: '/roles/:id',
    tokens: [[0,"roles"],[1,"id"]],
    types: placeholder as Registry['roles.update']['types'],
  },
  'roles.destroy': {
    methods: ["DELETE"],
    pattern: '/roles/:id',
    tokens: [[0,"roles"],[1,"id"]],
    types: placeholder as Registry['roles.destroy']['types'],
  },
  'settings.index': {
    methods: ["GET","HEAD"],
    pattern: '/settings',
    tokens: [[0,"settings"]],
    types: placeholder as Registry['settings.index']['types'],
  },
  'profile.update': {
    methods: ["PUT"],
    pattern: '/settings/profile',
    tokens: [[0,"settings"],[0,"profile"]],
    types: placeholder as Registry['profile.update']['types'],
  },
  'password.update': {
    methods: ["PUT"],
    pattern: '/settings/password',
    tokens: [[0,"settings"],[0,"password"]],
    types: placeholder as Registry['password.update']['types'],
  },
  'tokens.destroy': {
    methods: ["DELETE"],
    pattern: '/settings/tokens/:id',
    tokens: [[0,"settings"],[0,"tokens"],[1,"id"]],
    types: placeholder as Registry['tokens.destroy']['types'],
  },
  'tokens.store': {
    methods: ["POST"],
    pattern: '/settings/tokens',
    tokens: [[0,"settings"],[0,"tokens"]],
    types: placeholder as Registry['tokens.store']['types'],
  },
  'dashboard.show': {
    methods: ["GET","HEAD"],
    pattern: '/dashboard',
    tokens: [[0,"dashboard"]],
    types: placeholder as Registry['dashboard.show']['types'],
  },
  'notifications.index': {
    methods: ["GET","HEAD"],
    pattern: '/notifications',
    tokens: [[0,"notifications"]],
    types: placeholder as Registry['notifications.index']['types'],
  },
  'notifications.markRead': {
    methods: ["POST"],
    pattern: '/notifications/:id/read',
    tokens: [[0,"notifications"],[1,"id"],[0,"read"]],
    types: placeholder as Registry['notifications.markRead']['types'],
  },
  'notifications.markAllSeen': {
    methods: ["POST"],
    pattern: '/notifications/seen',
    tokens: [[0,"notifications"],[0,"seen"]],
    types: placeholder as Registry['notifications.markAllSeen']['types'],
  },
  'notifications.markAllRead': {
    methods: ["POST"],
    pattern: '/notifications/read',
    tokens: [[0,"notifications"],[0,"read"]],
    types: placeholder as Registry['notifications.markAllRead']['types'],
  },
  'network_drives.index': {
    methods: ["GET","HEAD"],
    pattern: '/media/network-drives',
    tokens: [[0,"media"],[0,"network-drives"]],
    types: placeholder as Registry['network_drives.index']['types'],
  },
  'network_drives.create': {
    methods: ["GET","HEAD"],
    pattern: '/media/network-drives/create',
    tokens: [[0,"media"],[0,"network-drives"],[0,"create"]],
    types: placeholder as Registry['network_drives.create']['types'],
  },
  'network_drives.store': {
    methods: ["POST"],
    pattern: '/media/network-drives',
    tokens: [[0,"media"],[0,"network-drives"]],
    types: placeholder as Registry['network_drives.store']['types'],
  },
  'network_drives.edit': {
    methods: ["GET","HEAD"],
    pattern: '/media/network-drives/:id/edit',
    tokens: [[0,"media"],[0,"network-drives"],[1,"id"],[0,"edit"]],
    types: placeholder as Registry['network_drives.edit']['types'],
  },
  'network_drives.update': {
    methods: ["PUT","PATCH"],
    pattern: '/media/network-drives/:id',
    tokens: [[0,"media"],[0,"network-drives"],[1,"id"]],
    types: placeholder as Registry['network_drives.update']['types'],
  },
  'network_drives.destroy': {
    methods: ["DELETE"],
    pattern: '/media/network-drives/:id',
    tokens: [[0,"media"],[0,"network-drives"],[1,"id"]],
    types: placeholder as Registry['network_drives.destroy']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
