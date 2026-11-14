import { AppLogo } from '#common/ui/components/app_logo'
import { NavHeaderMain } from '#common/ui/components/nav_header_main'
import { NavHeaderMobile } from '#common/ui/components/nav_header_mobile'
import { NavUser } from '#common/ui/components/nav_user'
import { LanguageSwitcher } from '#common/ui/components/language_switcher'
import { NotificationBell } from '#common/ui/components/notification_bell'
import { ToggleTheme } from '#common/ui/components/toggle_theme'

import useUser from '#auth/ui/hooks/use_user'
import { useTranslation } from '#common/ui/hooks/use_translation'

import { getMainNav, getNavUser } from '#common/ui/config/navigation.config'

/** Top bar shared by the logged-in shells (AuthenticatedLayout, WorkspaceLayout). */
export function AppHeader() {
  const user = useUser()
  const { t } = useTranslation()
  const navMain = getMainNav(t)
  const navUser = getNavUser(t)

  if (!user) return null

  return (
    <div className="border-sidebar-border/80 border-b shrink-0">
      <div className="mx-auto flex h-16 items-center px-6 max-w-7xl">
        <NavHeaderMobile items={navMain} />

        <AppLogo />

        <div className="ml-6 hidden h-full items-center space-x-6 lg:flex">
          <NavHeaderMain items={navMain} />
        </div>

        <div className="ml-auto flex items-center space-x-2">
          <div className="relative flex items-center space-x-1">
            <NotificationBell />
            <ToggleTheme />
            <LanguageSwitcher />
            <NavUser user={user} options={navUser} />
          </div>
        </div>
      </div>
    </div>
  )
}
