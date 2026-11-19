import logger from '@adonisjs/core/services/logger'

type Handlers = {
  onData: (data: any) => void
  onError?: (message: string) => void
}

type Subscription = { path: string; input: unknown; handlers: Handlers }

type ServerMessage = {
  id?: number | null
  method?: string
  result?: { type: 'started' | 'data' | 'stopped'; data?: unknown }
  error?: { message?: string }
}

export type SocketStatus = { connected: boolean; error: string | null }

export type WebSocketFactory = (url: string) => WebSocket

const RETRY_DELAYS_MS = [1000, 2000, 5000, 10_000]

/**
 * Minimal tRPC-over-WebSocket client for the `/trpc` endpoint Companion's own web UI uses
 * (undocumented, JSON without transformer). Reconnects forever and replays subscriptions.
 */
export class CompanionTrpcSocket {
  #url: string
  #socket: WebSocket | null = null
  #nextId = 1
  #subscriptions = new Map<number, Subscription>()
  #retry = 0
  #retryTimer: NodeJS.Timeout | null = null
  #closed = false

  constructor(
    baseUrl: string,
    private onStatus: (status: SocketStatus) => void,
    private createSocket: WebSocketFactory = (url) => new WebSocket(url)
  ) {
    const url = new URL('/trpc', baseUrl)
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    this.#url = url.toString()
    this.#connect()
  }

  subscribe(path: string, input: unknown, handlers: Handlers): () => void {
    const id = this.#nextId++
    this.#subscriptions.set(id, { path, input, handlers })
    this.#send({ id, method: 'subscription', params: { path, input } })

    return () => {
      if (!this.#subscriptions.delete(id)) return
      this.#send({ id, method: 'subscription.stop' })
    }
  }

  close() {
    this.#closed = true
    if (this.#retryTimer) clearTimeout(this.#retryTimer)
    this.#subscriptions.clear()
    this.#socket?.close()
  }

  #connect() {
    let socket: WebSocket
    try {
      socket = this.createSocket(this.#url)
    } catch (error) {
      this.#scheduleReconnect(error instanceof Error ? error.message : String(error))
      return
    }
    this.#socket = socket

    socket.addEventListener('open', () => {
      this.#retry = 0
      logger.info({ url: this.#url }, 'Companion connected')
      this.onStatus({ connected: true, error: null })
      for (const [id, { path, input }] of this.#subscriptions) {
        this.#send({ id, method: 'subscription', params: { path, input } })
      }
    })

    socket.addEventListener('message', (event) => this.#onMessage(String(event.data)))

    // Node's WebSocket reports the cause on `error`; `close` follows with no detail.
    let lastError: string | null = null
    socket.addEventListener('error', (event) => {
      lastError = (event as ErrorEvent).message || 'WebSocket error'
    })
    socket.addEventListener('close', (event) => {
      if (this.#socket !== socket || this.#closed) return
      this.#socket = null
      this.#scheduleReconnect(lastError ?? `connection closed (code ${event.code})`)
    })
  }

  #scheduleReconnect(reason: string) {
    const delay = RETRY_DELAYS_MS[Math.min(this.#retry++, RETRY_DELAYS_MS.length - 1)]
    logger.warn({ url: this.#url, retryInMs: delay }, 'Companion connection failed: %s', reason)
    this.onStatus({ connected: false, error: `${this.#url}: ${reason}` })
    this.#retryTimer = setTimeout(() => this.#connect(), delay)
  }

  #onMessage(raw: string) {
    if (raw === 'PING') return this.#socket?.send('PONG')

    let message: ServerMessage
    try {
      message = JSON.parse(raw)
    } catch {
      logger.debug({ raw: raw.slice(0, 200) }, 'Companion sent a non-JSON message')
      return
    }

    const subscription = typeof message.id === 'number' && this.#subscriptions.get(message.id)
    if (!subscription) return

    if (message.error) {
      const detail = message.error.message ?? 'unknown error'
      logger.warn({ path: subscription.path }, 'Companion subscription failed: %s', detail)
      subscription.handlers.onError?.(`${subscription.path}: ${detail}`)
      return
    }
    if (message.result?.type === 'data') subscription.handlers.onData(message.result.data)
  }

  #send(message: unknown) {
    if (this.#socket?.readyState === WebSocket.OPEN) this.#socket.send(JSON.stringify(message))
  }
}
