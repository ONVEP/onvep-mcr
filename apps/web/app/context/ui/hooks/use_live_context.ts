import { useEffect, useState } from 'react'
import { router } from '@inertiajs/react'

import type { JsonObject } from '#context/types/engine'

export type LiveStatus = 'connecting' | 'live' | 'offline'

type Notification = { path: string; value?: JsonObject }

/**
 * Keeps the whole context in sync with the engine's SSE stream (`context`
 * channel = root). The browser talks to the engine directly for this
 * read-only stream; writes go through the web app.
 */
export function useLiveContext(engineUrl: string, initial: JsonObject | null) {
  const [context, setContext] = useState(initial)
  const [status, setStatus] = useState<LiveStatus>('connecting')

  // Writes redirect back: the fresh server props win over a possibly stale stream.
  useEffect(() => setContext(initial), [initial])

  useEffect(() => {
    if (initial === null) return

    let cancelled = false
    let cleanup = () => {}

    const init = async () => {
      // Dedicated client: the app-wide singleton targets this app's own origin.
      const { Transmit } = await import('@adonisjs/transmit-client')
      if (cancelled) return

      const transmit = new Transmit({ baseUrl: engineUrl })
      let disconnected = false

      const onConnected = () => {
        setStatus('live')
        // Events emitted while disconnected are lost: refetch once back.
        if (disconnected) router.reload({ only: ['context'] })
        disconnected = false
      }
      const onDisconnected = () => {
        disconnected = true
        setStatus('offline')
      }
      transmit.on('connected', onConnected)
      transmit.on('disconnected', onDisconnected)
      transmit.on('reconnecting', onDisconnected)

      const subscription = transmit.subscription('context')
      subscription.onMessage<Notification>((message) => setContext(message.value ?? {}))
      await subscription.create()
      if (!cancelled) setStatus('live')

      cleanup = () => {
        void subscription.delete()
        transmit.close()
      }
    }

    void init().catch(() => setStatus('offline'))

    return () => {
      cancelled = true
      cleanup()
    }
  }, [engineUrl, initial === null])

  return { context, status }
}
