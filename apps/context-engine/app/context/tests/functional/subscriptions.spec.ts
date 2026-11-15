import { randomUUID } from 'node:crypto'
import { setTimeout as sleep } from 'node:timers/promises'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import env from '#start/env'
import { setupContextEngine } from '#tests/helpers/context'

type Message = { channel: string; payload: { path: string; value?: unknown; changes: string[] } }

/** Open streams keep the test server from shutting down, even when a test fails early */
const openStreams = new Set<AbortController>()

const baseUrl = () => `http://${env.get('HOST')}:${env.get('PORT')}`

/**
 * Opens a real SSE stream on the test server and subscribes it to `channels`,
 * the same way @adonisjs/transmit-client does.
 */
async function subscribe(channels: string[]) {
  const uid = randomUUID()
  const abort = new AbortController()
  openStreams.add(abort)
  const response = await fetch(`${baseUrl()}/__transmit/events?uid=${uid}`, {
    signal: abort.signal,
  })
  const messages: Message[] = []

  void (async () => {
    const reader = response.body!.pipeThrough(new TextDecoderStream()).getReader()
    let buffer = ''
    try {
      while (true) {
        const { value, done } = await reader.read()
        if (done) return
        buffer += value
        const lines = buffer.split('\n')
        buffer = lines.pop()!
        for (const line of lines) {
          if (line.startsWith('data: ')) messages.push(JSON.parse(line.slice(6)))
        }
      }
    } catch {}
  })()

  for (const channel of channels) {
    const subscribed = await fetch(`${baseUrl()}/__transmit/subscribe`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ uid, channel }),
    })
    if (subscribed.status !== 204) throw new Error(`Cannot subscribe to ${channel}`)
  }

  return {
    messages,
    /** Lets in-flight SSE frames arrive before asserting */
    settle: () => sleep(100),
    close: () => {
      abort.abort()
      openStreams.delete(abort)
    },
  }
}

test.group('context | subscriptions', (group) => {
  let ctx: Awaited<ReturnType<typeof setupContextEngine>>

  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())
  group.each.setup(async () => {
    ctx = await setupContextEngine()
    await ctx.seed({ layers: [{ name: 'test', value: 0 }], title: 'x' })
    return () => {
      for (const stream of openStreams) stream.abort()
      openStreams.clear()
      ctx.cleanup()
    }
  })

  test('notifies the changed path and all its ancestors', async ({ client, assert }) => {
    const sse = await subscribe([
      'context',
      'context/layers',
      'context/layers.0.name',
      'context/title',
    ])

    const write = await client.put('/context/layers.0.name').json({ value: 'renamed' })
    write.assertStatus(200)
    await sse.settle()
    sse.close()

    const byChannel = Object.fromEntries(sse.messages.map((m) => [m.channel, m.payload]))
    assert.sameMembers(Object.keys(byChannel), [
      'context',
      'context/layers',
      'context/layers.0.name',
    ])
    assert.deepEqual(byChannel['context/layers'], {
      path: 'layers',
      value: [{ name: 'renamed', value: 0 }],
      changes: ['layers.0.name'],
    })
    assert.deepEqual(byChannel['context/layers.0.name'], {
      path: 'layers.0.name',
      value: 'renamed',
      changes: ['layers.0.name'],
    })
  })

  test('notifies descendants when a subtree is replaced', async ({ client, assert }) => {
    const sse = await subscribe(['context/layers.0.name', 'context/layers.0.value'])

    await client.put('/context/layers').json({ value: [{ name: 'other', value: 0 }] })
    await sse.settle()
    sse.close()

    assert.deepEqual(sse.messages, [
      {
        channel: 'context/layers.0.name',
        payload: { path: 'layers.0.name', value: 'other', changes: ['layers.0.name'] },
      },
    ])
  })

  test('omits the value when the path was removed', async ({ client, assert }) => {
    const sse = await subscribe(['context/title'])

    const removal = await client.delete('/context/title')
    removal.assertStatus(200)
    await sse.settle()
    sse.close()

    assert.deepEqual(sse.messages, [
      { channel: 'context/title', payload: { path: 'title', changes: ['title'] } },
    ])
  })

  test('broadcasts changes made by mutators, and nothing on rollback', async ({
    client,
    assert,
  }) => {
    await ctx.addMutator(
      'mirror.js',
      `export const subscriptions = ['title']
      export default (o, n) => {
        if (n.title === 'fail') throw new Error('no')
        return { ...n, mirror: n.title }
      }`
    )
    const sse = await subscribe(['context/mirror'])

    const failure = await client.put('/context/title').json({ value: 'fail' })
    failure.assertStatus(422)
    const success = await client.put('/context/title').json({ value: 'y' })
    success.assertStatus(200)
    await sse.settle()
    sse.close()

    assert.deepEqual(sse.messages, [
      { channel: 'context/mirror', payload: { path: 'mirror', value: 'y', changes: ['mirror'] } },
    ])
  })

  test('does not broadcast no-op writes', async ({ client, assert }) => {
    const sse = await subscribe(['context'])

    const response = await client.put('/context/title').json({ value: 'x' })
    response.assertBodyContains({ changes: [] })
    await sse.settle()
    sse.close()

    assert.lengthOf(sse.messages, 0)
  })
})
