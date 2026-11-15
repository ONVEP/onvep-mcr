/**
 * Node-RED nodes for the context engine (apps/context-engine). Dependency-free: plain fetch,
 * and a minimal reader for the Transmit SSE stream the engine pushes changes through.
 */
const { randomUUID } = require('node:crypto')

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

function channelFor(path) {
  return path === '' ? 'context' : `context/${path}`
}

/** Path from the node config, else from the message (`msg.path`, then `msg.topic`). */
function pathFor(config, msg) {
  if (config.path) return config.path
  const path = msg.path ?? msg.topic ?? ''
  return typeof path === 'string' ? path : String(path)
}

module.exports = function (RED) {
  // --- context-engine (config): HTTP client + one shared SSE connection ------------------------

  function ContextEngineNode(config) {
    RED.nodes.createNode(this, config)
    const node = this
    node.url = (config.url || process.env.CONTEXT_ENGINE_URL || 'http://localhost:3334').replace(
      /\/+$/,
      ''
    )

    /** channel → Set of { onMessage, onConnected } */
    const subscribers = new Map()
    const statusListeners = new Set()
    let controller = null
    let uid = null
    let connected = false
    let closing = false
    let retryTimer = null

    const setConnected = (value) => {
      connected = value
      for (const listener of statusListeners) listener(value)
    }

    node.request = async (method, path, value) => {
      const init = { method, headers: { accept: 'application/json' } }
      if (value !== undefined) {
        init.headers['content-type'] = 'application/json'
        init.body = JSON.stringify({ value })
      }
      const response = await fetch(`${node.url}/context/${encodeURIComponent(path)}`, init)
      const body = await response.json().catch(() => null)
      if (!response.ok) {
        const error = new Error(body?.message ?? `Context engine responded ${response.status}`)
        error.code = body?.code
        error.statusCode = response.status
        throw error
      }
      return body
    }

    const sendSubscribe = async (channel) => {
      const response = await fetch(`${node.url}/__transmit/subscribe`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ uid, channel }),
      })
      if (!response.ok) throw new Error(`Subscription to ${channel} refused (${response.status})`)
    }

    const announce = (channel) => {
      for (const subscriber of subscribers.get(channel) ?? []) subscriber.onConnected()
    }

    const connect = async () => {
      if (controller || closing || subscribers.size === 0) return
      clearTimeout(retryTimer)
      controller = new AbortController()
      uid = randomUUID()
      try {
        const response = await fetch(`${node.url}/__transmit/events?uid=${uid}`, {
          headers: { accept: 'text/event-stream' },
          signal: controller.signal,
        })
        if (!response.ok) throw new Error(`Event stream refused (${response.status})`)

        // A new uid has no subscriptions: (re)subscribe everything, then let nodes read the
        // current value, since changes made while disconnected were never received.
        await Promise.all([...subscribers.keys()].map(sendSubscribe))
        setConnected(true)
        for (const channel of subscribers.keys()) announce(channel)

        for await (const data of readEvents(response.body)) {
          let event
          try {
            event = JSON.parse(data)
          } catch {
            continue
          }
          for (const subscriber of subscribers.get(event.channel) ?? []) {
            subscriber.onMessage(event.payload)
          }
        }
        throw new Error('Event stream closed')
      } catch (error) {
        if (!closing) node.debug(`SSE: ${error.message}`)
      } finally {
        controller = null
        if (connected) setConnected(false)
        if (!closing && subscribers.size > 0) retryTimer = setTimeout(connect, RETRY_DELAY)
      }
    }

    /** Subscribes to a context path; returns the unsubscribe function. */
    node.subscribe = (path, onMessage, onConnected) => {
      const channel = channelFor(path)
      const subscriber = { onMessage, onConnected }
      const isNewChannel = !subscribers.has(channel)
      if (isNewChannel) subscribers.set(channel, new Set())
      subscribers.get(channel).add(subscriber)

      if (!controller) void connect()
      else if (connected) {
        const ready = isNewChannel ? sendSubscribe(channel) : Promise.resolve()
        ready.then(onConnected, (error) => node.warn(error.message))
      }

      return () => {
        const set = subscribers.get(channel)
        set?.delete(subscriber)
        if (set?.size !== 0) return
        subscribers.delete(channel)
        if (connected) {
          fetch(`${node.url}/__transmit/unsubscribe`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ uid, channel }),
          }).catch(() => {})
        }
      }
    }

    node.onStatus = (listener) => {
      statusListeners.add(listener)
      listener(connected)
      return () => statusListeners.delete(listener)
    }

    node.on('close', (done) => {
      closing = true
      clearTimeout(retryTimer)
      controller?.abort()
      done()
    })
  }
  RED.nodes.registerType('context-engine', ContextEngineNode)

  // --- context in: emits on every change below a path -------------------------------------------

  function ContextInNode(config) {
    RED.nodes.createNode(this, config)
    const node = this
    const engine = RED.nodes.getNode(config.engine)
    if (!engine) return node.status({ fill: 'red', shape: 'ring', text: 'no engine' })

    const path = config.path ?? ''
    const emit = (value, changes) =>
      node.send({ topic: path, payload: value, exists: value !== undefined, changes })

    const offStatus = engine.onStatus((connected) =>
      node.status(
        connected
          ? { fill: 'green', shape: 'dot', text: 'connected' }
          : { fill: 'red', shape: 'ring', text: 'disconnected' }
      )
    )
    const unsubscribe = engine.subscribe(
      path,
      (message) => emit(message.value, message.changes),
      () => {
        if (!config.initial) return
        engine.request('GET', path).then(
          (body) => emit(body.value, []),
          (error) => {
            if (error.statusCode === 404) emit(undefined, [])
            else node.error(error.message)
          }
        )
      }
    )

    node.on('close', () => {
      unsubscribe()
      offStatus()
    })
  }
  RED.nodes.registerType('context in', ContextInNode)

  // --- context get / context set: one HTTP call per message -------------------------------------

  function ContextGetNode(config) {
    RED.nodes.createNode(this, config)
    const node = this
    const engine = RED.nodes.getNode(config.engine)

    node.on('input', async (msg, send, done) => {
      if (!engine) return done(new Error('No context engine configured'))
      const path = pathFor(config, msg)
      try {
        const body = await engine.request('GET', path)
        msg.path = path
        msg.payload = body.value
        send(msg)
        done()
      } catch (error) {
        done(error)
      }
    })
  }
  RED.nodes.registerType('context get', ContextGetNode)

  const METHODS = { set: 'PUT', merge: 'PATCH', append: 'POST', delete: 'DELETE' }

  function ContextSetNode(config) {
    RED.nodes.createNode(this, config)
    const node = this
    const engine = RED.nodes.getNode(config.engine)

    node.on('input', async (msg, send, done) => {
      if (!engine) return done(new Error('No context engine configured'))
      const action = config.action === 'msg' ? msg.action : config.action
      const method = METHODS[action]
      if (!method) return done(new Error(`Unknown action "${action}" (set, merge, append, delete)`))

      const path = pathFor(config, msg)
      try {
        const body = await engine.request(
          method,
          path,
          action === 'delete' ? undefined : (msg.payload ?? null)
        )
        msg.path = path
        msg.payload = body.value
        msg.changes = body.changes
        msg.version = body.version
        send(msg)
        done()
      } catch (error) {
        // A catch node gets the engine code (E_CONTEXT_VALIDATION, E_MUTATOR…) in msg.error.code.
        done(error)
      }
    })
  }
  RED.nodes.registerType('context set', ContextSetNode)
}
