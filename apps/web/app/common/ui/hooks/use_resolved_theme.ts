import { useEffect, useState } from 'react'

import { useTheme } from '@workspace/ui/components/theme-provider'

/** The theme actually displayed: "system" resolved against the OS preference. */
export function useResolvedTheme(): 'light' | 'dark' {
  const { theme } = useTheme()
  const [systemDark, setSystemDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [])

  if (theme === 'system') return systemDark ? 'dark' : 'light'
  return theme === 'dark' ? 'dark' : 'light'
}
