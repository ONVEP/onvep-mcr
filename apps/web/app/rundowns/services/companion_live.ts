import transmit from '@adonisjs/transmit/services/main'

import type CompanionServer from '#rundowns/models/companion_server'
import { CompanionSession } from '#rundowns/services/companion_session'
import type { CompanionLiveEvent, CompanionSnapshot } from '#rundowns/types/companion'

export const companionChannel = (serverId: number) => `companion_servers/${serverId}`

/**
 * One live Companion session per server, shared by every request and relayed to browsers
 * on the server's Transmit channel. Sessions stay connected once opened.
 * Resolve it from the container so tests can swap it.
 */
export class CompanionLive {
  // Static: the container builds a new instance per resolution.
  static #sessions = new Map<number, CompanionSession>()

  /** Opens the server's session, or applies its new URL / technical pages. */
  sync(server: CompanionServer): CompanionSession {
    const existing = CompanionLive.#sessions.get(server.id)
    if (existing && existing.url === server.url) {
      existing.setTechnicalPages(server.technicalPages)
      return existing
    }

    existing?.close()
    const channel = companionChannel(server.id)
    const session = new CompanionSession(server.url, server.technicalPages, (event) =>
      transmit.broadcast(channel, event as unknown as Parameters<typeof transmit.broadcast>[1])
    )
    CompanionLive.#sessions.set(server.id, session)
    return session
  }

  /** Applies a server change to its session, without opening one. */
  refresh(server: CompanionServer) {
    if (CompanionLive.#sessions.has(server.id)) this.sync(server)
  }

  async snapshot(server: CompanionServer, timeoutMs = 3000): Promise<CompanionSnapshot> {
    const session = this.sync(server)
    await session.settled(timeoutMs)
    return session.snapshot()
  }

  remove(serverId: number) {
    CompanionLive.#sessions.get(serverId)?.close()
    CompanionLive.#sessions.delete(serverId)
  }
}

export type { CompanionLiveEvent }
