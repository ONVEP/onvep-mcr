import transmit from '@adonisjs/transmit/services/main'

// Public channel: CG pages are opened by playout software, which can't log in.
export const CG_CHANNEL = 'cg'

/**
 * Tells open /cg pages to reload. With `slugs`, /cg/layer pages of other layers
 * ignore it; /cg/all always reloads.
 */
export function reloadCgPages(slugs?: string[]) {
  transmit.broadcast(CG_CHANNEL, { slugs: slugs ?? null })
}
