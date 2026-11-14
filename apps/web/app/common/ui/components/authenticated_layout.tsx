import React from 'react'

import { ModalRoot } from 'adonis-inertia-modal/react'
import { Toaster } from '@workspace/ui/components/sonner'

import { AppHeader } from '#common/ui/components/app_header'
import Breadcrumb from '#common/ui/components/breadcrumbs'

import useUser from '#auth/ui/hooks/use_user'
import useFlashToasts from '#common/ui/hooks/use_flash_toasts'

interface BreadcrumbItemProps {
  label: string
  href?: string
}

interface AuthenticatedLayoutProps extends React.PropsWithChildren {
  breadcrumbs?: BreadcrumbItemProps[]
}

const EMPTY_BREADCRUMBS: BreadcrumbItemProps[] = []

export default function AuthenticatedLayout({
  children,
  breadcrumbs = EMPTY_BREADCRUMBS,
}: AuthenticatedLayoutProps) {
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

        <div className="flex-1 overflow-y-auto w-full">
          <div className="border-sidebar-border/70 flex w-full border-b shrink-0">
            <div className="mx-auto flex h-12 w-full items-center justify-start px-6 max-w-7xl">
              <Breadcrumb breadcrumbs={breadcrumbs} />
            </div>
          </div>

          <main className="mx-auto flex h-full w-full max-w-7xl flex-col gap-4 px-6">
            {children}
          </main>
        </div>
      </div>
      <ModalRoot />
    </>
  )
}
