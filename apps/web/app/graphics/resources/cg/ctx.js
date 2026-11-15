/**
 * Binds CG layer markup to the context engine, through attributes:
 *
 * - ctx-source="a.b"   subscribes to that context path; it and its descendants read from it
 * - ctx-show="x.y"     sets `data-show` while the value is truthy
 * - ctx-value="x.y"    replaces the text content with the value
 * - ctx-each="x.y"     repeats the element for every item of the array; `$` (or `$<name>`
 *                      with ctx-each-name="<name>") is the current item: ctx-value="$.title"
 * - ctx-each-max="5"   only renders a slice of at most 5 items
 * - ctx-each-loop="10" with a max, moves to the next slice every 10 seconds
 *
 * Paths are dotted and relative to the nearest ctx-source; array indexes are plain segments.
 * Dependency-free on purpose: playout machines are often offline. Only the Transmit client
 * (served next to this file) is loaded, and only when the page has a ctx-source.
 *
 * Debug logs: add `?ctx-debug` to the page URL, or run `ctxDebug = true` in the console
 * (also works in the editor preview). `ctxSources` exposes the bound sources and their last value.
 */

const ENGINE_URL = document.querySelector('meta[name="ctx-engine"]')?.content

// --- Debug -----------------------------------------------------------------------------------

window.ctxDebug ??= new URLSearchParams(location.search).has('ctx-debug')

function debug(...args) {
  if (window.ctxDebug) console.log('%c[ctx]', 'color:#0ea5e9;font-weight:bold', ...args)
}

// --- Paths -----------------------------------------------------------------------------------

function resolve(path, scope) {
  const segments = path.split('.').filter((segment) => segment !== '')
  let value = scope.root
  if (segments[0]?.startsWith('$')) {
    const alias = segments.shift()
    if (!(alias in scope.items)) {
      debug(`"${path}": no ctx-each named "${alias}" around here`)
      return undefined
    }
    value = scope.items[alias]
  }
  for (const segment of segments) {
    if (value === null || typeof value !== 'object') return undefined
    value = value[segment]
  }
  return value
}

function toText(value) {
  if (value === undefined || value === null) return ''
  return typeof value === 'object' ? JSON.stringify(value) : String(value)
}

// --- Templates -------------------------------------------------------------------------------

/** True when no other ctx-source sits between `element` and `root`: it belongs to `root`. */
function belongsTo(element, root) {
  for (
    let parent = element.parentElement;
    parent && parent !== root;
    parent = parent.parentElement
  ) {
    if (parent.hasAttribute('ctx-source')) return false
  }
  return true
}

/**
 * Detaches every ctx-each of `root` (outermost first) and leaves an anchor comment in its
 * place: the element becomes the template its copies are cloned from.
 */
function prepare(root) {
  for (;;) {
    const element = [...root.querySelectorAll('[ctx-each]')].find((candidate) =>
      belongsTo(candidate, root)
    )
    if (!element) return root

    const anchor = document.createComment(`ctx-each ${element.getAttribute('ctx-each')}`)
    anchor.ctxEach = {
      path: element.getAttribute('ctx-each'),
      name: element.getAttribute('ctx-each-name'),
      max: Number.parseInt(element.getAttribute('ctx-each-max') ?? '', 10) || 0,
      loop: Number.parseFloat(element.getAttribute('ctx-each-loop') ?? '') || 0,
      template: element,
      copies: [],
      page: 0,
      scope: null,
      timer: null,
    }
    element.replaceWith(anchor)
    element.removeAttribute('ctx-each')
  }
}

// --- Rendering -------------------------------------------------------------------------------

function renderElement(element, scope) {
  if (element.hasAttribute('ctx-show')) {
    element.toggleAttribute('data-show', !!resolve(element.getAttribute('ctx-show'), scope))
  }
  if (element.hasAttribute('ctx-value')) {
    const text = toText(resolve(element.getAttribute('ctx-value'), scope))
    // Untouched when equal: rewriting the text would restart CSS animations on it.
    if (element.textContent !== text) element.textContent = text
    return
  }
  for (const child of [...element.childNodes]) renderNode(child, scope)
}

function renderNode(node, scope) {
  if (node.nodeType === Node.COMMENT_NODE && node.ctxEach) return renderEach(node, scope)
  if (node.nodeType !== Node.ELEMENT_NODE) return
  // Copies are rendered by their ctx-each, nested sources by their own subscription.
  if (node.ctxCopy || node.hasAttribute('ctx-source')) return
  renderElement(node, scope)
}

function renderEach(anchor, scope) {
  const each = anchor.ctxEach
  each.scope = scope

  const array = resolve(each.path, scope)
  if (array !== undefined && !Array.isArray(array)) {
    debug(`ctx-each="${each.path}" is not an array:`, array)
  }
  let items = Array.isArray(array) ? array : []
  if (each.max > 0 && items.length > each.max) {
    const pages = Math.ceil(items.length / each.max)
    each.page %= pages
    items = items.slice(each.page * each.max, (each.page + 1) * each.max)
    debug(
      `ctx-each="${each.path}": slice ${each.page + 1}/${pages}, ${items.length} of ${array.length} items`
    )
  } else {
    each.page = 0
    debug(`ctx-each="${each.path}": ${items.length} items`)
  }

  // Copies are reused by position, so unchanged items keep their DOM (and animations).
  while (each.copies.length > items.length) each.copies.pop().remove()
  while (each.copies.length < items.length) {
    const copy = prepare(each.template.cloneNode(true))
    copy.ctxCopy = true
    ;(each.copies.at(-1) ?? anchor).after(copy)
    each.copies.push(copy)
  }

  items.forEach((item, index) => {
    const aliases = { $: item }
    if (each.name) aliases[`$${each.name}`] = item
    renderElement(each.copies[index], { root: scope.root, items: { ...scope.items, ...aliases } })
  })

  if (each.loop > 0 && each.max > 0 && !each.timer) {
    each.timer = setInterval(() => {
      // The anchor goes away with its parent copy when the outer array shrinks.
      if (!anchor.isConnected) return clearInterval(each.timer)
      each.page += 1
      renderEach(anchor, each.scope)
    }, each.loop * 1000)
  }
}

// --- Sources ---------------------------------------------------------------------------------

async function fetchValue(path) {
  const response = await fetch(`${ENGINE_URL}/context/${encodeURIComponent(path)}`)
  if (response.status === 404) {
    debug(`"${path}" doesn't exist in the context (yet)`)
    return undefined
  }
  if (!response.ok) throw new Error(`Context engine responded ${response.status}`)
  return (await response.json()).value
}

async function start() {
  const elements = [...document.querySelectorAll('[ctx-source]')]
  if (elements.length === 0) return debug('No ctx-source on this page')
  if (!ENGINE_URL) return console.warn('[ctx] No context engine URL configured')

  // Innermost first: an outer source must not detach the ctx-each of an inner one.
  const sources = elements.reverse().map((element) => {
    const source = {
      element: prepare(element),
      path: element.getAttribute('ctx-source'),
      value: undefined,
    }
    source.render = (value) => {
      source.value = value
      const startedAt = performance.now()
      renderElement(source.element, { root: value, items: {} })
      debug(`rendered "${source.path}" in ${(performance.now() - startedAt).toFixed(1)} ms`, value)
    }
    return source
  })
  window.ctxSources = sources
  debug(
    `engine ${ENGINE_URL}, sources:`,
    sources.map((source) => source.path)
  )

  const { Transmit } = await import('/cg/assets/transmit.js')
  const transmit = new Transmit({ baseUrl: ENGINE_URL })

  const refresh = (source) =>
    fetchValue(source.path).then(source.render, (error) => console.error('[ctx]', error))

  let disconnected = false
  transmit.on('disconnected', () => {
    debug('disconnected from the engine')
    disconnected = true
  })
  transmit.on('reconnecting', () => {
    debug('reconnecting…')
    disconnected = true
  })
  // Changes made while disconnected were never received.
  transmit.on('connected', () => {
    debug('connected')
    if (disconnected) {
      debug('back online: reading every source again')
      sources.forEach(refresh)
    }
    disconnected = false
  })

  await Promise.all(
    sources.map(async (source) => {
      const subscription = transmit.subscription(
        source.path === '' ? 'context' : `context/${source.path}`
      )
      subscription.onMessage((message) => {
        debug(`update on "${source.path}", changed:`, message.changes)
        source.render(message.value)
      })
      // Subscribed before the first read, so no change can slip in between.
      await subscription.create()
      debug(`subscribed to "${source.path}"`)
      await refresh(source)
    })
  )
}

start().catch((error) => console.error('[ctx]', error))
