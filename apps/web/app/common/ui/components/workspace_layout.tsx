import React from 'react'

import { ModalRoot } from 'adonis-inertia-modal/react'
import { Toaster } from '@workspace/ui/components/sonner'

import { AppHeader } from '#common/ui/components/app_header'

import useUser from '#auth/ui/hooks/use_user'
import useFlashToasts from '#common/ui/hooks/use_flash_toasts'

/**
 * Logged-in shell for full-bleed tool pages (editors): same header as AuthenticatedLayout,
 * but the content takes the whole remaining viewport, with no max-width nor breadcrumb.
 */
export default function WorkspaceLayout({ children }: React.PropsWithChildren) {
  const user = useUser()

  useFlashToasts()

  if (!user) {
    return null
  }

  return (
    <>
      <Toaster />
      <div className="h-svh flex flex-col overflow-hidden">
        <AppHeader />
        <main className="flex min-h-0 flex-1">{children}</main>
      </div>
      <ModalRoot />
    </>
  )
}
