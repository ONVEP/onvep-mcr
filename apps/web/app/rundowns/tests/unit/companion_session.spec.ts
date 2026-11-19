import { test } from '@japa/runner'

import { CompanionSession } from '#rundowns/services/companion_session'
import type { CompanionLiveEvent } from '#rundowns/types/companion'

type Sent = { id: number; method: string; params?: { path: string; input: any } }

class FakeSocket extends EventTarget {
  readyState: number = WebSocket.CONNECTING
  sent: Sent[] = []

  constructor(readonly url: string) {
    super()
  }

  send(raw: string) {
    this.sent.push(JSON.parse(raw))
  }

  close() {}

  open() {
    this.readyState = WebSocket.OPEN
    this.dispatchEvent(new Event('open'))
  }

  receive(message: unknown) {
    this.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(message) }))
  }

  subscriptionId(path: string, pageNumber?: number) {
    const found = this.sent.findLast(
      (m) =>
        m.method === 'subscription' &&
        m.params?.path === path &&
        (pageNumber === undefined || m.params.input.location.pageNumber === pageNumber)
    )
    if (!found) throw new Error(`no subscription to ${path}`)
    return found.id
  }
}

function setup(technicalPages: string[] = []) {
  let socket!: FakeSocket
  const events: CompanionLiveEvent[] = []
  const session = new CompanionSession(
    'http://companion.test:8000',
    technicalPages,
    (event) => events.push(event),
    (url) => {
      socket = new FakeSocket(url)
      return socket as unknown as WebSocket
    }
  )
  socket.open()
  return { session, socket, events }
}

const INIT = {
  type: 'init',
  order: ['main', 'tech'],
  pages: {
    main: { name: 'MAIN', controls: { '0': { '0': 'bank:a' } } },
    tech: { name: 'TECH', controls: { '0': { '1': 'bank:b' }, '1': { '0': 'bank:c', '1': null } } },
  },
}

test.group('CompanionSession', () => {
  test('connects to /trpc and watches the pages', ({ assert }) => {
    const { session, socket } = setup()

    assert.equal(socket.url, 'ws://companion.test:8000/trpc')
    socket.receive({
      id: socket.subscriptionId('pages.watch'),
      result: { type: 'data', data: INIT },
    })

    const { pages, status } = session.snapshot()
    assert.isTrue(status.connected)
    assert.deepEqual(
      pages?.list.map(({ id, number, name, buttonCount }) => ({ id, number, name, buttonCount })),
      [
        { id: 'main', number: 1, name: 'MAIN', buttonCount: 1 },
        { id: 'tech', number: 2, name: 'TECH', buttonCount: 2 },
      ]
    )
  })

  test('streams the rendered image of each technical page button', ({ assert }) => {
    const { session, socket, events } = setup(['tech'])
    socket.receive({
      id: socket.subscriptionId('pages.watch'),
      result: { type: 'data', data: INIT },
    })

    const previews = socket.sent.filter((m) => m.params?.path === 'preview.graphics.location')
    assert.sameDeepMembers(
      previews.map((m) => m.params!.input.location),
      [
        { pageNumber: 2, row: 0, column: 1 },
        { pageNumber: 2, row: 1, column: 0 },
      ]
    )

    socket.receive({
      id: previews[0].id,
      result: { type: 'data', data: { image: 'data:image/png;base64,AAA', isUsed: true } },
    })

    const button = session.snapshot().buttons.find((b) => b.image)
    assert.include(button, { pageId: 'tech', page: 2, image: 'data:image/png;base64,AAA' })
    assert.deepInclude(events, { type: 'button', button: button! })
  })

  test('follows a page moved in Companion', ({ assert }) => {
    const { session, socket } = setup(['tech'])
    const pagesWatch = socket.subscriptionId('pages.watch')
    socket.receive({ id: pagesWatch, result: { type: 'data', data: INIT } })
    const oldPreview = socket.subscriptionId('preview.graphics.location', 2)

    socket.receive({
      id: pagesWatch,
      result: { type: 'data', data: { changes: [], added: [], updatedOrder: ['tech', 'main'] } },
    })

    assert.deepInclude(socket.sent, { id: oldPreview, method: 'subscription.stop' })
    socket.subscriptionId('preview.graphics.location', 1)
    assert.isTrue(session.snapshot().buttons.every((b) => b.pageId === 'tech' && b.page === 1))
  })

  test('drops the buttons of a page no longer technical', ({ assert }) => {
    const { session, socket, events } = setup(['tech'])
    socket.receive({
      id: socket.subscriptionId('pages.watch'),
      result: { type: 'data', data: INIT },
    })

    session.setTechnicalPages([])

    assert.lengthOf(session.snapshot().buttons, 0)
    assert.lengthOf(
      events.filter((e) => e.type === 'button_removed'),
      2
    )
    // Image and config of both buttons.
    assert.lengthOf(
      socket.sent.filter((m) => m.method === 'subscription.stop'),
      4
    )
  })

  test('resolves the button text with its variables, live', ({ assert }) => {
    const { session, socket } = setup(['main'])
    socket.receive({
      id: socket.subscriptionId('pages.watch'),
      result: { type: 'data', data: INIT },
    })
    const control = socket.sent.find((m) => m.params?.path === 'controls.watchControl')!
    assert.deepEqual(control.params!.input, { controlId: 'bank:a' })

    socket.receive({
      id: control.id,
      result: {
        type: 'data',
        data: {
          type: 'init',
          config: {
            type: 'button-layered',
            style: {
              layers: [
                { type: 'canvas' },
                {
                  type: 'text',
                  text: { value: 'Il est $(internal:time_hms)', isExpression: false },
                },
              ],
            },
          },
        },
      },
    })
    const expression = socket.subscriptionId('preview.expressionStream.watchExpression')
    assert.deepEqual(socket.sent.find((m) => m.id === expression)!.params!.input, {
      controlId: 'bank:a',
      expression: 'Il est $(internal:time_hms)',
      isVariableString: true,
    })

    for (const time of ['13:34:24', '13:34:25']) {
      socket.receive({
        id: expression,
        result: { type: 'data', data: { ok: true, value: `Il est ${time}` } },
      })
    }

    assert.deepInclude(session.snapshot().buttons[0], {
      controlType: 'button-layered',
      textSource: 'Il est $(internal:time_hms)',
      text: 'Il est 13:34:25',
      textError: null,
    })
  })

  test('re-reads the button config after an edit in Companion', ({ assert }) => {
    const { socket } = setup(['main'])
    socket.receive({
      id: socket.subscriptionId('pages.watch'),
      result: { type: 'data', data: INIT },
    })
    const control = socket.subscriptionId('controls.watchControl')

    socket.receive({ id: control, result: { type: 'data', data: { type: 'config', patch: [] } } })

    assert.deepInclude(socket.sent, { id: control, method: 'subscription.stop' })
    assert.notEqual(socket.subscriptionId('controls.watchControl'), control)
  })

  test('reports a failed connection as an error status', async ({ assert }) => {
    const { session, socket } = setup()
    socket.dispatchEvent(Object.assign(new Event('error'), { message: 'ECONNREFUSED' }))
    socket.dispatchEvent(Object.assign(new Event('close'), { code: 1006 }))

    const { status } = session.snapshot()
    assert.isFalse(status.connected)
    assert.include(status.error, 'ECONNREFUSED')
    session.close()
  })
})
