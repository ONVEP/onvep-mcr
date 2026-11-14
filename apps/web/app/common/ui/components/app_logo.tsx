import { Link } from '@adonisjs/inertia/react'

import { cn } from '@workspace/ui/lib/utils'

import logoBlack from '../images/onvep_black.png'
import logoWhite from '../images/onvep_white.png'

export function AppLogoMark({ className }: { className?: string }) {
  return (
    <>
      <img src={logoBlack} alt="ONVEP" className={cn(className, 'dark:hidden')} />
      <img src={logoWhite} alt="ONVEP" className={cn(className, 'hidden dark:block')} />
    </>
  )
}

export function AppLogo() {
  return (
    <Link route="marketing.show" prefetch className="flex items-center space-x-2">
      <div className="flex aspect-square size-8 items-center justify-center">
        <AppLogoMark className="size-8" />
      </div>
      <div className="ml-1 grid flex-1 text-left leading-tight text-sm">
        <span className="font-semibold">ONVEP MCR</span>
      </div>
    </Link>
  )
}
