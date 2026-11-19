import { useEffect, useState } from 'react'
import { router } from '@inertiajs/react'

import { getTransmitSingleton } from '#common/ui/hooks/use_transmit'

import type {
  CompanionButton,
  CompanionLiveEvent,
  CompanionPages,
  CompanionSnapshot,
  CompanionStatus,
} from '#rundowns/types/companion'

type LiveState = {
  status: CompanionStatus
  pages: CompanionPages | null
  // A removed button keeps its `seq` (image null) so an older snapshot can't bring it back.
  buttons: Map<string, CompanionButton & { removed?: boolean }>
}

const buttonKey = (b: { pageId: string; row: number; column: number }) =>
  `${b.pageId}/${b.row}/${b.column}`

const newer = <T extends { seq: number }>(current: T | null, next: T) =>
  !current || next.seq > current.seq ? next : current

function mergeSnapshot(state: LiveState | null, snapshot: CompanionSnapshot): LiveState {
  const buttons = new Map(state?.buttons)
  const inSnapshot = new Set<string>()
  for (const button of snapshot.buttons) {
    const key = buttonKey(button)
    inSnapshot.add(key)
    buttons.set(key, newer(buttons.get(key) ?? null, button))
  }
  for (const [key, button] of buttons) {
    if (!inSnapshot.has(key) && button.seq <= snapshot.seq) buttons.delete(key)
  }

  return {
    status: newer(state?.status ?? null, snapshot.status),
    pages: snapshot.pages ? newer(state?.pages ?? null, snapshot.pages) : (state?.pages ?? null),
    buttons,
  }
}

function applyEvent(state: LiveState, event: CompanionLiveEvent): LiveState {
  switch (event.type) {
    case 'status':
      return { ...state, status: newer(state.status, event.status) }
    case 'pages':
      return { ...state, pages: newer(state.pages, event.pages) }
    case 'button':
    case 'button_removed': {
      const next =
        event.type === 'button'
          ? event.button
          : {
              seq: event.seq,
              pageId: event.pageId,
              row: event.row,
              column: event.column,
              page: 0,
              image: null,
              controlType: null,
              textSource: null,
              text: null,
              textError: null,
              removed: true,
            }
      const key = buttonKey(next)
      const current = state.buttons.get(key) ?? null
      if (current && current.seq >= next.seq) return state
      const buttons = new Map(state.buttons)
      buttons.set(key, next)
      return { ...state, buttons }
    }
  }
}

/**
 * Live Companion state of the show page: starts from the server snapshot, then follows
 * the server's Transmit channel. Every item carries a `seq`, so whichever of the snapshot
 * and the stream is newer wins.
 */
export function useCompanionLive(channel: string, snapshot: CompanionSnapshot) {
  const [state, setState] = useState<LiveState>(() => mergeSnapshot(null, snapshot))

  useEffect(() => setState((current) => mergeSnapshot(current, snapshot)), [snapshot])

  useEffect(() => {
    let cancelled = false
    let subscription: { delete: () => Promise<void> } | null = null

    const init = async () => {
      const transmit = await getTransmitSingleton()
      if (cancelled) return

      const sub = transmit.subscription(channel)
      sub.onMessage<CompanionLiveEvent>((event) =>
        setState((current) => applyEvent(current, event))
      )
      await sub.create()
      subscription = sub
      // Changes between the page render and the subscription were missed: resync once.
      if (!cancelled) router.reload({ only: ['live'] })
    }

    void init()

    return () => {
      cancelled = true
      void subscription?.delete()
    }
  }, [channel])

  const buttons = [...state.buttons.values()].filter((button) => !button.removed)
  return { status: state.status, pages: state.pages, buttons }
}
