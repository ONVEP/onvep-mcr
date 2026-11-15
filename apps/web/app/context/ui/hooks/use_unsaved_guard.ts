import { useEffect } from 'react'
import { router } from '@inertiajs/react'

/** While `dirty`, confirm before leaving the page or visiting another one. */
export function useUnsavedGuard(dirty: boolean, message: string) {
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', onBeforeUnload)
    const removeInertiaListener = router.on('before', (event) => {
      if (event.detail.visit.method !== 'get') return
      if (!window.confirm(message)) event.preventDefault()
    })
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      removeInertiaListener()
    }
  }, [dirty, message])
}
