/**
 * Minimal context engine client: plain fetch, and a reader for the Transmit SSE stream the
 * engine pushes changes through (same protocol as the Node-RED nodes).
 */
import { randomUUID } from 'node:crypto'

const RETRY_DELAY = 2000

/** Yields the `data` of each server-sent event of a fetch response body. */
async function* readEvents(body) {
  const decoder = new TextDecoder()
  let buffer = ''
  for await (const chunk of body) {
    buffer += decoder.decode(chunk, { stream: true }).replace(/\r\n?/g, '\n')
    let end
    while ((end = buffer.indexOf('\n\n')) !== -1) {
      const block = buffer.slice(0, end)
      buffer = buffer.slice(end + 2)
      const data = block
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).replace(/^ /, ''))
        .join('\n')
      if (data) yield data
    }
  }
}

/** Accepts `host:port` too: fetch rejects a URL without scheme. */
export function normalizeUrl(raw) {
  const url = raw.trim().replace(/\/+$/, '')
  return /^[a-z][a-z\d+.-]*:\/\//i.test(url) ? url : `http://${url}`
}

export function channelFor(path) {
  return path === '' ? 'context' : `context/${path}`
}

export class ContextEngine {
  #controller = null
  #closed = false
  #retryTimer = null

  /**
   * @param {string} url
   * @param {{ onConnected: () => void, onDisconnected: (error: Error, wasConnected: boolean) => void, onEvent: (channel: string, payload: any) => void }} handlers
   */
  constructor(url, handlers) {
    this.url = url
    this.handlers = handlers
  }

  async #fetch(path, init) {
    try {
      return await fetch(`${this.url}${path}`, init)
    } catch (error) {
      if (error.name === 'AbortError') throw error
      // Connection errors often come with an empty message and only a code (ECONNREFUSED…).
      const cause = error.cause?.code || error.cause?.message || error.message
      throw new Error(`Cannot reach the context engine at ${this.url}: ${cause}`)
    }
  }

  async request(method, path, value) {
    const init = { method, headers: { accept: 'application/json' } }
    if (value !== undefined) {
      init.headers['content-type'] = 'application/json'
      init.body = JSON.stringify({ value })
    }
    const response = await this.#fetch(`/context/${encodeURIComponent(path)}`, init)
    const body = await response.json().catch(() => null)
    if (!response.ok) {
      const error = new Error(body?.message ?? `Context engine responded ${response.status}`)
      error.code = body?.code
      error.statusCode = response.status
      throw error
    }
    return body
  }

  /** The value at `path`, undefined when it doesn't exist. */
  async read(path) {
    try {
      return (await this.request('GET', path)).value
    } catch (error) {
      if (error.statusCode === 404) return undefined
      throw error
    }
  }

  /** Keeps an event stream subscribed to `channels` open (and re-opened) until close(). */
  watch(channels) {
    this.channels = channels
    void this.#connect()
  }

  async #connect() {
    if (this.#closed) return
    this.#controller = new AbortController()
    const uid = randomUUID()
    let connected = false
    try {
      const response = await this.#fetch(`/__transmit/events?uid=${uid}`, {
        headers: { accept: 'text/event-stream' },
        signal: this.#controller.signal,
      })
      if (!response.ok) throw new Error(`Event stream refused (${response.status})`)

      // A new uid has no subscriptions: subscribe everything again on every connection.
      await Promise.all(this.channels.map((channel) => this.#subscribe(uid, channel)))
      connected = true
      this.handlers.onConnected()

      for await (const data of readEvents(response.body)) {
        let event
        try {
          event = JSON.parse(data)
        } catch {
          continue
        }
        this.handlers.onEvent(event.channel, event.payload)
      }
      throw new Error('Event stream closed')
    } catch (error) {
      if (!this.#closed) this.handlers.onDisconnected(error, connected)
    } finally {
      this.#controller = null
      if (!this.#closed) this.#retryTimer = setTimeout(() => this.#connect(), RETRY_DELAY)
    }
  }

  async #subscribe(uid, channel) {
    const response = await this.#fetch('/__transmit/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ uid, channel }),
    })
    if (!response.ok) throw new Error(`Subscription to ${channel} refused (${response.status})`)
  }

  close() {
    this.#closed = true
    clearTimeout(this.#retryTimer)
    this.#controller?.abort()
  }
}
