import { useState } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { MenuIcon, XIcon } from 'lucide-react'

import Container from '#marketing/ui/components/container'
import { AppLogo } from '#common/ui/components/app_logo'
import { LanguageSwitcher } from '#common/ui/components/language_switcher'
import { useTranslation } from '#common/ui/hooks/use_translation'

const NAV_ITEMS = [
  { href: '#features', key: 'marketing.nav.features' },
  { href: '#how-it-works', key: 'marketing.nav.how_it_works' },
] as const

export default function HeaderSection() {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
      <Container className="flex h-16 items-center justify-between">
        <div
          className={`absolute top-16 left-0 w-full h-[calc(100vh-4rem)] bg-background z-40 flex flex-col gap-2 px-6 py-8 transition-all duration-300 ${
            menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          } md:hidden`}
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="rounded-xl px-4 py-3 font-medium hover:bg-accent"
            >
              {t(item.key)}
            </a>
          ))}
          <Link
            route="auth.sign_in.show"
            className="mt-4 w-full rounded-xl bg-primary text-primary-foreground font-semibold px-4 py-3 text-center"
          >
            {t('marketing.nav.get_started')}
          </Link>
        </div>

        <AppLogo />

        <div className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t(item.key)}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Link
            route="auth.sign_in.show"
            className="hidden md:inline-flex rounded-full bg-primary text-primary-foreground px-5 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {t('marketing.nav.get_started')}
          </Link>
          <button
            type="button"
            aria-label={t('marketing.nav.toggle_menu')}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center justify-center rounded-md p-2 hover:bg-accent md:hidden"
          >
            {menuOpen ? <XIcon className="size-5" /> : <MenuIcon className="size-5" />}
          </button>
        </div>
      </Container>
    </nav>
  )
}
