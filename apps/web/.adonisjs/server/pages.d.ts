import '@adonisjs/inertia/types'

import type React from 'react'
import type { Prettify } from '@adonisjs/core/types/common'

type ExtractProps<T> =
  T extends React.FC<infer Props>
    ? Prettify<Omit<Props, 'children'>>
    : T extends React.Component<infer Props>
      ? Prettify<Omit<Props, 'children'>>
      : never

declare module '@adonisjs/inertia/types' {
  export interface InertiaPages {
    'analytics/dashboard': ExtractProps<(typeof import('../../app/analytics/ui/pages/dashboard.tsx'))['default']>
    'auth/forgot_password': ExtractProps<(typeof import('../../app/auth/ui/pages/forgot_password.tsx'))['default']>
    'auth/reset_password': ExtractProps<(typeof import('../../app/auth/ui/pages/reset_password.tsx'))['default']>
    'auth/sign_in': ExtractProps<(typeof import('../../app/auth/ui/pages/sign_in.tsx'))['default']>
    'core/errors/not_found': ExtractProps<(typeof import('../../app/core/ui/pages/errors/not_found.tsx'))['default']>
    'core/errors/server_error': ExtractProps<(typeof import('../../app/core/ui/pages/errors/server_error.tsx'))['default']>
    'marketing/show': ExtractProps<(typeof import('../../app/marketing/ui/pages/show.tsx'))['default']>
    'media/network_drives/create': ExtractProps<(typeof import('../../app/media/ui/pages/network_drives/create.tsx'))['default']>
    'media/network_drives/edit': ExtractProps<(typeof import('../../app/media/ui/pages/network_drives/edit.tsx'))['default']>
    'media/network_drives/index': ExtractProps<(typeof import('../../app/media/ui/pages/network_drives/index.tsx'))['default']>
    'users/create': ExtractProps<(typeof import('../../app/users/ui/pages/create.tsx'))['default']>
    'users/edit': ExtractProps<(typeof import('../../app/users/ui/pages/edit.tsx'))['default']>
    'users/index': ExtractProps<(typeof import('../../app/users/ui/pages/index.tsx'))['default']>
    'users/invite': ExtractProps<(typeof import('../../app/users/ui/pages/invite.tsx'))['default']>
    'users/roles/create': ExtractProps<(typeof import('../../app/users/ui/pages/roles/create.tsx'))['default']>
    'users/roles/edit': ExtractProps<(typeof import('../../app/users/ui/pages/roles/edit.tsx'))['default']>
    'users/roles/index': ExtractProps<(typeof import('../../app/users/ui/pages/roles/index.tsx'))['default']>
    'users/settings': ExtractProps<(typeof import('../../app/users/ui/pages/settings.tsx'))['default']>
  }
}
