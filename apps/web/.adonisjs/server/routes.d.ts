import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'marketing.show': { paramsTuple?: []; params?: {} }
    'auth.sign_in.show': { paramsTuple?: []; params?: {} }
    'auth.sign_in.handle': { paramsTuple?: []; params?: {} }
    'auth.sign_out.handle': { paramsTuple?: []; params?: {} }
    'auth.forgot_password.show': { paramsTuple?: []; params?: {} }
    'auth.forgot_password.handle': { paramsTuple?: []; params?: {} }
    'auth.reset_password.show': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'auth.reset_password.handle': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'locale.switch': { paramsTuple: [ParamValue]; params: {'locale': ParamValue} }
    'users.invite.show': { paramsTuple?: []; params?: {} }
    'users.invite.handle': { paramsTuple?: []; params?: {} }
    'users.impersonate.handle': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.index': { paramsTuple?: []; params?: {} }
    'users.create': { paramsTuple?: []; params?: {} }
    'users.store': { paramsTuple?: []; params?: {} }
    'users.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.index': { paramsTuple?: []; params?: {} }
    'roles.create': { paramsTuple?: []; params?: {} }
    'roles.store': { paramsTuple?: []; params?: {} }
    'roles.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'settings.index': { paramsTuple?: []; params?: {} }
    'profile.update': { paramsTuple?: []; params?: {} }
    'password.update': { paramsTuple?: []; params?: {} }
    'tokens.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tokens.store': { paramsTuple?: []; params?: {} }
    'dashboard.show': { paramsTuple?: []; params?: {} }
    'network_drives.index': { paramsTuple?: []; params?: {} }
    'network_drives.create': { paramsTuple?: []; params?: {} }
    'network_drives.store': { paramsTuple?: []; params?: {} }
    'network_drives.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'network_drives.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'network_drives.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'live.show': { paramsTuple?: []; params?: {} }
    'rundowns.index': { paramsTuple?: []; params?: {} }
    'rundowns.create': { paramsTuple?: []; params?: {} }
    'rundowns.store': { paramsTuple?: []; params?: {} }
    'rundowns.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'rundowns.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'rundowns.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'rundowns.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'steps.store': { paramsTuple: [ParamValue]; params: {'rundown_id': ParamValue} }
    'steps.update': { paramsTuple: [ParamValue,ParamValue]; params: {'rundown_id': ParamValue,'id': ParamValue} }
    'steps.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'rundown_id': ParamValue,'id': ParamValue} }
    'steps.move': { paramsTuple: [ParamValue,ParamValue]; params: {'rundown_id': ParamValue,'id': ParamValue} }
    'step_types.index': { paramsTuple?: []; params?: {} }
    'step_types.store': { paramsTuple?: []; params?: {} }
    'step_types.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'step_types.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'layers.index': { paramsTuple?: []; params?: {} }
    'layers.store': { paramsTuple?: []; params?: {} }
    'layers.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'layers.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'layers.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'graphics.tailwind_classes': { paramsTuple?: []; params?: {} }
    'custom_css.update': { paramsTuple?: []; params?: {} }
    'css_variables.index': { paramsTuple?: []; params?: {} }
    'css_variables.store': { paramsTuple?: []; params?: {} }
    'css_variables.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'css_variables.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'cg.all': { paramsTuple?: []; params?: {} }
    'cg.layer': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'cg.tailwind': { paramsTuple?: []; params?: {} }
    'cg.transmit': { paramsTuple?: []; params?: {} }
    'cg.ctx': { paramsTuple?: []; params?: {} }
    'context.index': { paramsTuple?: []; params?: {} }
    'context.values.update': { paramsTuple?: []; params?: {} }
    'context.values.store': { paramsTuple?: []; params?: {} }
    'context.values.destroy': { paramsTuple?: []; params?: {} }
    'context.mutators.index': { paramsTuple?: []; params?: {} }
    'context.mutators.store': { paramsTuple?: []; params?: {} }
    'context.mutators.show': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'context.mutators.update': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'context.mutators.destroy': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'context.validators.index': { paramsTuple?: []; params?: {} }
    'context.validators.store': { paramsTuple?: []; params?: {} }
    'context.validators.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'context.validators.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'context.validators.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'context.versions.index': { paramsTuple?: []; params?: {} }
    'context.versions.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'context.versions.restore': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notifications.index': { paramsTuple?: []; params?: {} }
    'notifications.markRead': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notifications.markAllSeen': { paramsTuple?: []; params?: {} }
    'notifications.markAllRead': { paramsTuple?: []; params?: {} }
    'event_stream': { paramsTuple?: []; params?: {} }
    'subscribe': { paramsTuple?: []; params?: {} }
    'unsubscribe': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'marketing.show': { paramsTuple?: []; params?: {} }
    'auth.sign_in.show': { paramsTuple?: []; params?: {} }
    'auth.forgot_password.show': { paramsTuple?: []; params?: {} }
    'auth.reset_password.show': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'users.invite.show': { paramsTuple?: []; params?: {} }
    'users.index': { paramsTuple?: []; params?: {} }
    'users.create': { paramsTuple?: []; params?: {} }
    'users.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.index': { paramsTuple?: []; params?: {} }
    'roles.create': { paramsTuple?: []; params?: {} }
    'roles.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'settings.index': { paramsTuple?: []; params?: {} }
    'dashboard.show': { paramsTuple?: []; params?: {} }
    'network_drives.index': { paramsTuple?: []; params?: {} }
    'network_drives.create': { paramsTuple?: []; params?: {} }
    'network_drives.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'live.show': { paramsTuple?: []; params?: {} }
    'rundowns.index': { paramsTuple?: []; params?: {} }
    'rundowns.create': { paramsTuple?: []; params?: {} }
    'rundowns.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'rundowns.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'step_types.index': { paramsTuple?: []; params?: {} }
    'layers.index': { paramsTuple?: []; params?: {} }
    'layers.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'graphics.tailwind_classes': { paramsTuple?: []; params?: {} }
    'css_variables.index': { paramsTuple?: []; params?: {} }
    'cg.all': { paramsTuple?: []; params?: {} }
    'cg.layer': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'cg.tailwind': { paramsTuple?: []; params?: {} }
    'cg.transmit': { paramsTuple?: []; params?: {} }
    'cg.ctx': { paramsTuple?: []; params?: {} }
    'context.index': { paramsTuple?: []; params?: {} }
    'context.mutators.index': { paramsTuple?: []; params?: {} }
    'context.mutators.show': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'context.validators.index': { paramsTuple?: []; params?: {} }
    'context.validators.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'context.versions.index': { paramsTuple?: []; params?: {} }
    'context.versions.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notifications.index': { paramsTuple?: []; params?: {} }
    'event_stream': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'marketing.show': { paramsTuple?: []; params?: {} }
    'auth.sign_in.show': { paramsTuple?: []; params?: {} }
    'auth.forgot_password.show': { paramsTuple?: []; params?: {} }
    'auth.reset_password.show': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'users.invite.show': { paramsTuple?: []; params?: {} }
    'users.index': { paramsTuple?: []; params?: {} }
    'users.create': { paramsTuple?: []; params?: {} }
    'users.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.index': { paramsTuple?: []; params?: {} }
    'roles.create': { paramsTuple?: []; params?: {} }
    'roles.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'settings.index': { paramsTuple?: []; params?: {} }
    'dashboard.show': { paramsTuple?: []; params?: {} }
    'network_drives.index': { paramsTuple?: []; params?: {} }
    'network_drives.create': { paramsTuple?: []; params?: {} }
    'network_drives.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'live.show': { paramsTuple?: []; params?: {} }
    'rundowns.index': { paramsTuple?: []; params?: {} }
    'rundowns.create': { paramsTuple?: []; params?: {} }
    'rundowns.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'rundowns.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'step_types.index': { paramsTuple?: []; params?: {} }
    'layers.index': { paramsTuple?: []; params?: {} }
    'layers.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'graphics.tailwind_classes': { paramsTuple?: []; params?: {} }
    'css_variables.index': { paramsTuple?: []; params?: {} }
    'cg.all': { paramsTuple?: []; params?: {} }
    'cg.layer': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'cg.tailwind': { paramsTuple?: []; params?: {} }
    'cg.transmit': { paramsTuple?: []; params?: {} }
    'cg.ctx': { paramsTuple?: []; params?: {} }
    'context.index': { paramsTuple?: []; params?: {} }
    'context.mutators.index': { paramsTuple?: []; params?: {} }
    'context.mutators.show': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'context.validators.index': { paramsTuple?: []; params?: {} }
    'context.validators.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'context.versions.index': { paramsTuple?: []; params?: {} }
    'context.versions.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notifications.index': { paramsTuple?: []; params?: {} }
    'event_stream': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'auth.sign_in.handle': { paramsTuple?: []; params?: {} }
    'auth.sign_out.handle': { paramsTuple?: []; params?: {} }
    'auth.forgot_password.handle': { paramsTuple?: []; params?: {} }
    'auth.reset_password.handle': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'locale.switch': { paramsTuple: [ParamValue]; params: {'locale': ParamValue} }
    'users.invite.handle': { paramsTuple?: []; params?: {} }
    'users.impersonate.handle': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.store': { paramsTuple?: []; params?: {} }
    'roles.store': { paramsTuple?: []; params?: {} }
    'tokens.store': { paramsTuple?: []; params?: {} }
    'network_drives.store': { paramsTuple?: []; params?: {} }
    'rundowns.store': { paramsTuple?: []; params?: {} }
    'steps.store': { paramsTuple: [ParamValue]; params: {'rundown_id': ParamValue} }
    'steps.move': { paramsTuple: [ParamValue,ParamValue]; params: {'rundown_id': ParamValue,'id': ParamValue} }
    'step_types.store': { paramsTuple?: []; params?: {} }
    'layers.store': { paramsTuple?: []; params?: {} }
    'css_variables.store': { paramsTuple?: []; params?: {} }
    'context.values.store': { paramsTuple?: []; params?: {} }
    'context.mutators.store': { paramsTuple?: []; params?: {} }
    'context.validators.store': { paramsTuple?: []; params?: {} }
    'context.versions.restore': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notifications.markRead': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notifications.markAllSeen': { paramsTuple?: []; params?: {} }
    'notifications.markAllRead': { paramsTuple?: []; params?: {} }
    'subscribe': { paramsTuple?: []; params?: {} }
    'unsubscribe': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'users.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'profile.update': { paramsTuple?: []; params?: {} }
    'password.update': { paramsTuple?: []; params?: {} }
    'network_drives.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'rundowns.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'steps.update': { paramsTuple: [ParamValue,ParamValue]; params: {'rundown_id': ParamValue,'id': ParamValue} }
    'step_types.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'layers.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'custom_css.update': { paramsTuple?: []; params?: {} }
    'css_variables.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'context.values.update': { paramsTuple?: []; params?: {} }
    'context.mutators.update': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'context.validators.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PATCH: {
    'users.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'network_drives.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'rundowns.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'step_types.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'css_variables.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'users.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tokens.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'network_drives.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'rundowns.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'steps.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'rundown_id': ParamValue,'id': ParamValue} }
    'step_types.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'layers.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'css_variables.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'context.values.destroy': { paramsTuple?: []; params?: {} }
    'context.mutators.destroy': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'context.validators.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}