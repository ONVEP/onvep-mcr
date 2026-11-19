import {
  CompanionTrpcSocket,
  type SocketStatus,
  type WebSocketFactory,
} from '#rundowns/services/companion_trpc_socket'
import type {
  CompanionButton,
  CompanionLiveEvent,
  CompanionPages,
  CompanionSnapshot,
  CompanionStatus,
} from '#rundowns/types/companion'

// Same size as the button grid of Companion's own UI.
const IMAGE_SIZE = { width: 72, height: 72 }

type PageState = { id: string; name: string; controls: Map<string, string> }

// Shapes of Companion's `pages.watch` messages (its web UI's page store).
type ExportedPage = { name?: string; controls?: Record<string, Record<string, string | null>> }
type PagesMessage =
  | { type: 'init'; order: string[]; pages: Record<string, ExportedPage | undefined> }
  | {
      type?: undefined
      changes?: {
        id: string
        name?: string | null
        controls: { row: number; column: number; controlId: string | null }[]
      }[]
      added?: ({ id: string } & ExportedPage)[]
      updatedOrder?: string[] | null
    }

// Shapes of `controls.watchControl` messages (its web UI's button editor).
type TextProperty = { value?: unknown; isExpression?: boolean }
type ControlMessage =
  | {
      type: 'init'
      config?: {
        type?: string
        style?: {
          text?: unknown
          textExpression?: boolean
          layers?: { type?: string; text?: TextProperty }[]
        }
      }
    }
  | { type: 'config' | 'runtime' | 'destroy' }

type TextSource = { value: string; isExpression: boolean }

// Expressions may return numbers, booleans or objects.
const displayValue = (value: unknown) =>
  typeof value === 'string' ? value : value === undefined ? '' : JSON.stringify(value)

type ButtonSubscription = {
  page: number
  controlId: string
  button: CompanionButton
  // Each part is pending until its first message, for `settled()`.
  pending: Set<'image' | 'control' | 'text'>
  stops: { image: () => void; control: () => void; text: () => void }
}

// Layered buttons (Companion 4.1+) keep their text on the text layer; older ones in style.text.
function textSourceOf(
  config: Extract<ControlMessage, { type: 'init' }>['config']
): TextSource | null {
  const style = config?.style
  if (Array.isArray(style?.layers)) {
    const text = style.layers.find((layer) => layer.type === 'text')?.text
    return typeof text?.value === 'string'
      ? { value: text.value, isExpression: text.isExpression === true }
      : null
  }
  return typeof style?.text === 'string'
    ? { value: style.text, isExpression: style.textExpression === true }
    : null
}

const locationKey = (pageId: string, row: number | string, column: number | string) =>
  `${pageId}/${row}/${column}`

function toPageState(id: string, page: ExportedPage | undefined): PageState {
  const controls = new Map<string, string>()
  for (const [row, columns] of Object.entries(page?.controls ?? {})) {
    for (const [column, controlId] of Object.entries(columns ?? {})) {
      if (controlId) controls.set(`${row}/${column}`, controlId)
    }
  }
  return { id, name: page?.name ?? '', controls }
}

/**
 * Live view of one Companion server: its pages, and the rendered image of every button
 * on the technical pages. Each change is passed to `emit` for the browsers.
 */
export class CompanionSession {
  #socket: CompanionTrpcSocket
  // Starts from the clock so a recreated session (restart, new URL) still outranks the old one.
  #seq = Date.now()
  #status: CompanionStatus = { seq: this.#seq, connected: false, error: null }
  #pages: PageState[] | null = null
  #pagesSeq = 0
  #technicalPages: Set<string>
  #buttons = new Map<string, ButtonSubscription>()
  #waiters = new Set<() => void>()

  constructor(
    readonly url: string,
    technicalPages: string[],
    private emit: (event: CompanionLiveEvent) => void,
    createSocket?: WebSocketFactory
  ) {
    this.#technicalPages = new Set(technicalPages)
    this.#socket = new CompanionTrpcSocket(url, (s) => this.#onStatus(s), createSocket)
    this.#socket.subscribe('pages.watch', undefined, {
      onData: (message: PagesMessage) => this.#onPages(message),
      onError: (error) => this.#onStatus({ connected: this.#status.connected, error }),
    })
  }

  setTechnicalPages(technicalPages: string[]) {
    this.#technicalPages = new Set(technicalPages)
    this.#syncButtons()
  }

  close() {
    this.#socket.close()
    this.#buttons.clear()
    this.#notifyWaiters()
  }

  snapshot(): CompanionSnapshot {
    return {
      seq: this.#seq,
      status: this.#status,
      pages: this.#pages && this.#pagesSnapshot(),
      buttons: [...this.#buttons.values()].map(({ button }) => button),
    }
  }

  /** Resolves once the pages and the first frame of every button arrived, an error occurred, or after `timeoutMs`. */
  settled(timeoutMs: number): Promise<void> {
    if (this.#isSettled()) return Promise.resolve()
    return new Promise((resolve) => {
      const done = () => {
        clearTimeout(timer)
        this.#waiters.delete(check)
        resolve()
      }
      const check = () => this.#isSettled() && done()
      const timer = setTimeout(done, timeoutMs)
      this.#waiters.add(check)
    })
  }

  #isSettled() {
    if (this.#status.error) return true
    if (!this.#pages) return false
    return [...this.#buttons.values()].every(({ pending }) => pending.size === 0)
  }

  #notifyWaiters() {
    for (const check of [...this.#waiters]) check()
  }

  #onStatus({ connected, error }: SocketStatus) {
    this.#status = { seq: ++this.#seq, connected, error }
    this.emit({ type: 'status', status: this.#status })
    this.#notifyWaiters()
  }

  #onPages(message: PagesMessage) {
    if (message.type === 'init') {
      this.#pages = message.order.map((id) => toPageState(id, message.pages[id]))
    } else if (this.#pages) {
      const byId = new Map(this.#pages.map((page) => [page.id, page]))
      for (const change of message.changes ?? []) {
        const page = byId.get(change.id)
        if (!page) continue
        if (change.name !== null && change.name !== undefined) page.name = change.name
        for (const { row, column, controlId } of change.controls) {
          if (controlId) page.controls.set(`${row}/${column}`, controlId)
          else page.controls.delete(`${row}/${column}`)
        }
      }
      for (const added of message.added ?? []) byId.set(added.id, toPageState(added.id, added))
      if (message.updatedOrder) {
        this.#pages = message.updatedOrder.map((id) => byId.get(id) ?? toPageState(id, undefined))
      }
    } else {
      return
    }

    this.#pagesSeq = ++this.#seq
    this.emit({ type: 'pages', pages: this.#pagesSnapshot() })
    this.#syncButtons()
    this.#notifyWaiters()
  }

  #pagesSnapshot(): CompanionPages {
    return {
      seq: this.#pagesSeq,
      list: (this.#pages ?? []).map((page, index) => ({
        id: page.id,
        number: index + 1,
        name: page.name,
        buttonCount: page.controls.size,
      })),
    }
  }

  // Per button of the technical pages: its rendered image, its config (type and text
  // source) and the live value of that text.
  #syncButtons() {
    type Target = { pageId: string; page: number; row: number; column: number; controlId: string }
    const wanted = new Map<string, Target>()
    for (const [index, page] of (this.#pages ?? []).entries()) {
      if (!this.#technicalPages.has(page.id)) continue
      for (const [location, controlId] of page.controls) {
        const [row, column] = location.split('/').map(Number)
        wanted.set(locationKey(page.id, row, column), {
          pageId: page.id,
          page: index + 1,
          row,
          column,
          controlId,
        })
      }
    }

    for (const [key, subscription] of this.#buttons) {
      const target = wanted.get(key)
      // A moved page keeps its id but changes number: the image subscription must follow.
      if (
        target &&
        target.page === subscription.page &&
        target.controlId === subscription.controlId
      )
        continue
      this.#stop(subscription)
      this.#buttons.delete(key)
      if (!target) {
        const { pageId, row, column } = subscription.button
        this.emit({ type: 'button_removed', seq: ++this.#seq, pageId, row, column })
      }
    }

    for (const [key, { controlId, ...location }] of wanted) {
      if (this.#buttons.has(key)) continue
      const subscription: ButtonSubscription = {
        page: location.page,
        controlId,
        button: {
          seq: ++this.#seq,
          ...location,
          image: null,
          controlType: null,
          textSource: null,
          text: null,
          textError: null,
        },
        pending: new Set(['image', 'control', 'text']),
        stops: { image: () => {}, control: () => {}, text: () => {} },
      }
      this.#buttons.set(key, subscription)

      const update = (part: 'image' | 'control' | 'text', patch: Partial<CompanionButton>) => {
        if (this.#buttons.get(key) !== subscription) return
        subscription.pending.delete(part)
        subscription.button = { ...subscription.button, ...patch, seq: ++this.#seq }
        this.emit({ type: 'button', button: subscription.button })
        this.#notifyWaiters()
      }

      subscription.stops.image = this.#socket.subscribe(
        'preview.graphics.location',
        {
          location: { pageNumber: location.page, row: location.row, column: location.column },
          size: IMAGE_SIZE,
        },
        {
          onData: (data: { image?: string | null }) =>
            update('image', { image: data.image ?? null }),
        }
      )
      this.#watchControl(subscription, update)
    }
  }

  #watchControl(
    subscription: ButtonSubscription,
    update: (part: 'control' | 'text', patch: Partial<CompanionButton>) => void
  ) {
    subscription.stops.control = this.#socket.subscribe(
      'controls.watchControl',
      { controlId: subscription.controlId },
      {
        onData: (message: ControlMessage) => {
          // Edits arrive as JSON patches: re-subscribing yields a fresh `init` instead.
          if (message.type === 'config') {
            subscription.stops.control()
            this.#watchControl(subscription, update)
            return
          }
          if (message.type !== 'init') return

          const source = textSourceOf(message.config)
          const previous = subscription.button.textSource
          update('control', {
            controlType: message.config?.type ?? null,
            textSource: source?.value ?? null,
          })
          if (source?.value === previous && !subscription.pending.has('text')) return

          subscription.stops.text()
          if (!source) {
            update('text', { text: null, textError: null })
            return
          }
          subscription.stops.text = this.#socket.subscribe(
            'preview.expressionStream.watchExpression',
            {
              controlId: subscription.controlId,
              expression: source.value,
              isVariableString: !source.isExpression,
            },
            {
              onData: (result: { ok: boolean; value?: unknown; error?: string }) =>
                update(
                  'text',
                  result.ok
                    ? { text: displayValue(result.value), textError: null }
                    : { text: null, textError: result.error ?? 'error' }
                ),
              onError: (error) => update('text', { text: null, textError: error }),
            }
          )
        },
        onError: () => {
          subscription.pending.delete('control')
          subscription.pending.delete('text')
          this.#notifyWaiters()
        },
      }
    )
  }

  #stop(subscription: ButtonSubscription) {
    subscription.stops.image()
    subscription.stops.control()
    subscription.stops.text()
  }
}
