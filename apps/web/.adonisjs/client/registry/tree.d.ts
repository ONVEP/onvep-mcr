/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  drive: {
    fs: {
      serve: typeof routes['drive.fs.serve']
    }
  }
  marketing: {
    show: typeof routes['marketing.show']
  }
  auth: {
    signIn: {
      show: typeof routes['auth.sign_in.show']
      handle: typeof routes['auth.sign_in.handle']
    }
    signOut: {
      handle: typeof routes['auth.sign_out.handle']
    }
    forgotPassword: {
      show: typeof routes['auth.forgot_password.show']
      handle: typeof routes['auth.forgot_password.handle']
    }
    resetPassword: {
      show: typeof routes['auth.reset_password.show']
      handle: typeof routes['auth.reset_password.handle']
    }
  }
  locale: {
    switch: typeof routes['locale.switch']
  }
  users: {
    invite: {
      show: typeof routes['users.invite.show']
      handle: typeof routes['users.invite.handle']
    }
    impersonate: {
      handle: typeof routes['users.impersonate.handle']
    }
    index: typeof routes['users.index']
    create: typeof routes['users.create']
    store: typeof routes['users.store']
    edit: typeof routes['users.edit']
    update: typeof routes['users.update']
    destroy: typeof routes['users.destroy']
  }
  roles: {
    index: typeof routes['roles.index']
    create: typeof routes['roles.create']
    store: typeof routes['roles.store']
    edit: typeof routes['roles.edit']
    update: typeof routes['roles.update']
    destroy: typeof routes['roles.destroy']
  }
  settings: {
    index: typeof routes['settings.index']
  }
  profile: {
    update: typeof routes['profile.update']
  }
  password: {
    update: typeof routes['password.update']
  }
  tokens: {
    destroy: typeof routes['tokens.destroy']
    store: typeof routes['tokens.store']
  }
  dashboard: {
    show: typeof routes['dashboard.show']
  }
  networkDrives: {
    index: typeof routes['network_drives.index']
    create: typeof routes['network_drives.create']
    store: typeof routes['network_drives.store']
    edit: typeof routes['network_drives.edit']
    update: typeof routes['network_drives.update']
    destroy: typeof routes['network_drives.destroy']
  }
  live: {
    show: typeof routes['live.show']
  }
  rundowns: {
    index: typeof routes['rundowns.index']
    create: typeof routes['rundowns.create']
    store: typeof routes['rundowns.store']
    show: typeof routes['rundowns.show']
    edit: typeof routes['rundowns.edit']
    update: typeof routes['rundowns.update']
    destroy: typeof routes['rundowns.destroy']
  }
  steps: {
    store: typeof routes['steps.store']
    update: typeof routes['steps.update']
    destroy: typeof routes['steps.destroy']
    move: typeof routes['steps.move']
  }
  stepTypes: {
    index: typeof routes['step_types.index']
    store: typeof routes['step_types.store']
    update: typeof routes['step_types.update']
    destroy: typeof routes['step_types.destroy']
  }
  layers: {
    index: typeof routes['layers.index']
    store: typeof routes['layers.store']
    show: typeof routes['layers.show']
    update: typeof routes['layers.update']
    destroy: typeof routes['layers.destroy']
  }
  graphics: {
    tailwindClasses: typeof routes['graphics.tailwind_classes']
  }
  cg: {
    all: typeof routes['cg.all']
    layer: typeof routes['cg.layer']
    tailwind: typeof routes['cg.tailwind']
  }
  context: {
    index: typeof routes['context.index']
    values: {
      update: typeof routes['context.values.update']
      store: typeof routes['context.values.store']
      destroy: typeof routes['context.values.destroy']
    }
    mutators: {
      index: typeof routes['context.mutators.index']
      store: typeof routes['context.mutators.store']
      show: typeof routes['context.mutators.show']
      update: typeof routes['context.mutators.update']
      destroy: typeof routes['context.mutators.destroy']
    }
    validators: {
      index: typeof routes['context.validators.index']
      store: typeof routes['context.validators.store']
      show: typeof routes['context.validators.show']
      update: typeof routes['context.validators.update']
      destroy: typeof routes['context.validators.destroy']
    }
    versions: {
      index: typeof routes['context.versions.index']
      show: typeof routes['context.versions.show']
      restore: typeof routes['context.versions.restore']
    }
  }
  notifications: {
    index: typeof routes['notifications.index']
    markRead: typeof routes['notifications.markRead']
    markAllSeen: typeof routes['notifications.markAllSeen']
    markAllRead: typeof routes['notifications.markAllRead']
  }
  eventStream: typeof routes['event_stream']
  subscribe: typeof routes['subscribe']
  unsubscribe: typeof routes['unsubscribe']
}
