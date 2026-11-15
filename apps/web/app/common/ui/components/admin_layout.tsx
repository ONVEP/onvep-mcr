import React from 'react'

import { ModalRoot } from 'adonis-inertia-modal/react'
import { Toaster } from '@workspace/ui/components/sonner'
import { cn } from '@workspace/ui/lib/utils'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@workspace/ui/components/sidebar'

import { AppSidebar } from '#common/ui/components/app_sidebar'
import Breadcrumb from '#common/ui/components/breadcrumbs'
import { NavUser } from '#common/ui/components/nav_user'
import { LanguageSwitcher } from '#common/ui/components/language_switcher'
import { NotificationBell } from '#common/ui/components/notification_bell'
import { ToggleTheme } from '#common/ui/components/toggle_theme'
import { getCookie } from '#common/ui/utils/cookie_helper'

import useUser from '#auth/ui/hooks/use_user'
import useFlashToasts from '#common/ui/hooks/use_flash_toasts'
import usePageProps from '#common/ui/hooks/use_page_props'
import { useTranslation } from '#common/ui/hooks/use_translation'

import { getAdminNav, getNavUser } from '#common/ui/config/navigation.config'

interface BreadcrumbItemProps {
  label: string
  href?: string
}

interface AdminLayoutProps extends React.PropsWithChildren {
  breadcrumbs?: BreadcrumbItemProps[]
  // Full-bleed main area for workspace pages (sidebar + editor) that draw their own borders.
  flush?: boolean
}

const EMPTY_BREADCRUMBS: BreadcrumbItemProps[] = []

export default function AdminLayout({
  children,
  breadcrumbs = EMPTY_BREADCRUMBS,
  flush = false,
}: AdminLayoutProps) {
  const user = useUser()
  const { t } = useTranslation()
  const navMain = getAdminNav(t)
  const { nodeRedUrl } = usePageProps<{ nodeRedUrl: string | null }>()
  const navUser = getNavUser(t, nodeRedUrl)
  const defaultOpen = getCookie('sidebar_state') !== 'false'

  useFlashToasts()

  if (!user) {
    return null
  }

  return (
    <>
      <Toaster />
      <SidebarProvider defaultOpen={defaultOpen} className="h-svh overflow-hidden">
        <AppSidebar navMain={navMain} variant="inset" collapsible="icon" />
        <SidebarInset className="overflow-hidden">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6">
            <div className="flex flex-row items-center gap-2">
              <SidebarTrigger className="-ml-1" />

              <Breadcrumb breadcrumbs={breadcrumbs} />
            </div>

            <div className="flex flex-row items-center gap-2 ml-auto">
              <NotificationBell />
              <ToggleTheme />
              <LanguageSwitcher />
              <NavUser user={user} options={navUser} />
            </div>
          </header>
          <main
            className={cn(
              'flex flex-1 flex-col',
              flush ? 'min-h-0 overflow-hidden' : 'gap-4 py-4 px-6 overflow-y-auto'
            )}
          >
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
      <ModalRoot />
    </>
  )
}
