import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { latestVersion, setupContextEngine } from '#tests/helpers/context'

const readPersisted = async () => {
  const version = await latestVersion()
  return version.context as { layers: { name: string; value: unknown }[] }
}

test.group('context | read & write', (group) => {
  let ctx: Awaited<ReturnType<typeof setupContextEngine>>

  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())
  group.each.setup(async () => {
    ctx = await setupContextEngine()
    await ctx.seed({ layers: [{ name: 'test', value: 0 }] })
    return () => ctx.cleanup()
  })

  test('reads the root and nested paths', async ({ client }) => {
    const root = await client.get('/context')
    root.assertStatus(200)
    root.assertBody({ path: '', value: { layers: [{ name: 'test', value: 0 }] } })

    const name = await client.get('/context/layers.0.name')
    name.assertBody({ path: 'layers.0.name', value: 'test' })
  })

  test('returns 404 for a missing path', async ({ client }) => {
    const response = await client.get('/context/layers.4.name')
    response.assertStatus(404)
    response.assertBodyContains({ code: 'E_PATH_NOT_FOUND' })
  })

  test('sets a value and persists it', async ({ client, assert }) => {
    const response = await client.put('/context/layers.0.name').json({ value: 'renamed' })
    response.assertStatus(200)
    response.assertBodyContains({
      path: 'layers.0.name',
      value: 'renamed',
      changes: ['layers.0.name'],
    })

    assert.deepEqual(await readPersisted(), { layers: [{ name: 'renamed', value: 0 }] })
  })

  test('accepts null and empty strings as values', async ({ client }) => {
    const write = await client.put('/context/layers.0.name').json({ value: '' })
    write.assertStatus(200)
    const response = await client.put('/context/layers.0.value').json({ value: null })
    response.assertBodyContains({ value: null })
  })

  test('merges objects with JSON merge patch', async ({ client }) => {
    const response = await client
      .patch('/context/layers.0')
      .json({ value: { value: 5, visible: true } })
    response.assertBodyContains({ value: { name: 'test', value: 5, visible: true } })
  })

  test('appends to an array', async ({ client }) => {
    const response = await client.post('/context/layers').json({ value: { name: 'second' } })
    response.assertBodyContains({ value: [{ name: 'test', value: 0 }, { name: 'second' }] })
  })

  test('removes array items without leaving holes', async ({ client }) => {
    await client.post('/context/layers').json({ value: { name: 'second' } })
    const removal = await client.delete('/context/layers.0')
    removal.assertStatus(200)

    const response = await client.get('/context/layers')
    response.assertBody({ path: 'layers', value: [{ name: 'second' }] })
  })

  test('rejects writes through a primitive', async ({ client }) => {
    const response = await client.put('/context/layers.0.name.first').json({ value: 1 })
    response.assertStatus(400)
    response.assertBodyContains({ code: 'E_INVALID_PATH' })
  })

  test('requires a value in write payloads', async ({ client }) => {
    const write = await client.put('/context/layers').json({})
    write.assertStatus(422)
  })

  test('applies concurrent writes one after the other', async ({ client, assert }) => {
    await Promise.all(
      Array.from({ length: 10 }, (_, i) => client.post('/context/layers').json({ value: i }))
    )
    // Order depends on arrival, but nothing must be lost.
    const response = await client.get('/context/layers')
    assert.lengthOf(response.body().value, 11)
  })
})

test.group('context | persistence', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('reloads the persisted context on boot', async ({ client }) => {
    const first = await setupContextEngine()
    await first.seed({ show: { title: 'Evening news' } })
    first.cleanup()

    const second = await setupContextEngine()
    const response = await client.get('/context/show.title')
    response.assertBody({ path: 'show.title', value: 'Evening news' })
    second.cleanup()
  })

  test('starts from the initial context when nothing is persisted', async ({ client }) => {
    const ctx = await setupContextEngine({ initialContext: { layers: [] } })
    const response = await client.get('/context')
    response.assertBody({ path: '', value: { layers: [] } })
    ctx.cleanup()
  })
})

test.group('context | mutators', (group) => {
  let ctx: Awaited<ReturnType<typeof setupContextEngine>>

  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())
  group.each.setup(async () => {
    ctx = await setupContextEngine()
    await ctx.seed({ layers: [{ name: 'test', value: 0 }], title: 'x' })
    return () => ctx.cleanup()
  })

  test('runs mutators subscribed to a changed path', async ({ client }) => {
    await ctx.addMutator(
      'uppercase.js',
      `export const subscriptions = ['layers.*.name']
      export default function (oldContext, newContext) {
        for (const layer of newContext.layers) layer.label = layer.name.toUpperCase()
        return newContext
      }`
    )

    const response = await client.put('/context/layers.0.name').json({ value: 'hello' })
    response.assertStatus(200)
    response.assertBodyContains({ changes: ['layers.0.name', 'layers.0.label'] })

    const layer = await client.get('/context/layers.0')
    layer.assertBody({ path: 'layers.0', value: { name: 'hello', value: 0, label: 'HELLO' } })
  })

  test('skips mutators whose subscriptions are untouched', async ({ client }) => {
    await ctx.addMutator(
      'counter.js',
      `export const subscriptions = ['layers']
      export default (oldContext, newContext) => ({ ...newContext, touched: true })`
    )

    await client.put('/context/title').json({ value: 'y' })
    const read = await client.get('/context/touched')
    read.assertStatus(404)

    await client.put('/context/layers.0.value').json({ value: 1 })
    const readAfter = await client.get('/context/touched')
    readAfter.assertStatus(200)
  })

  test('passes the previous context and chains mutators in name order', async ({ client }) => {
    await ctx.addMutator(
      'a_history.js',
      `export const subscriptions = ['title']
      export default (oldContext, newContext) => ({ ...newContext, previousTitle: oldContext.title })`
    )
    await ctx.addMutator(
      'b_reacts_to_a.js',
      `export const subscriptions = ['previousTitle']
      export default (oldContext, newContext) => ({ ...newContext, sawHistory: true })`
    )

    await client.put('/context/title').json({ value: 'y' })

    const response = await client.get('/context')
    response.assertBodyContains({ value: { title: 'y', previousTitle: 'x', sawHistory: true } })
  })

  test('re-runs earlier mutators when a later one changes their subscriptions', async ({
    client,
  }) => {
    await ctx.addMutator(
      'a_total.js',
      `export const subscriptions = ['count']
      export default (o, n) => ({ ...n, total: n.count * 10 })`
    )
    await ctx.addMutator(
      'b_count.js',
      `export const subscriptions = ['title']
      export default (o, n) => ({ ...n, count: n.title.length })`
    )

    await client.put('/context/title').json({ value: 'abc' })

    const response = await client.get('/context')
    response.assertBodyContains({ value: { title: 'abc', count: 3, total: 30 } })
  })

  test('does not re-trigger a mutator with its own changes', async ({ client }) => {
    await ctx.addMutator(
      'increment.js',
      `export const subscriptions = ['count']
      export default (o, n) => ({ ...n, count: n.count + 1 })`
    )

    await client.put('/context/count').json({ value: 1 })

    const response = await client.get('/context/count')
    response.assertBody({ path: 'count', value: 2 })
  })

  test('aborts and rolls back mutators that trigger each other forever', async ({
    client,
    assert,
  }) => {
    await ctx.addMutator(
      'ping.js',
      `export const subscriptions = ['ping']
      export default (o, n) => ({ ...n, pong: n.ping + 1 })`
    )
    await ctx.addMutator(
      'pong.js',
      `export const subscriptions = ['pong']
      export default (o, n) => ({ ...n, ping: n.pong + 1 })`
    )

    const response = await client.put('/context/ping').json({ value: 0 })
    response.assertStatus(422)
    response.assertBodyContains({ code: 'E_MUTATOR_LOOP' })
    assert.sameMembers(response.body().mutators, ['ping.js', 'pong.js'])

    const read = await client.get('/context/ping')
    read.assertStatus(404)
  })

  test('honours the configured number of passes', async ({ client, assert }) => {
    const limited = await setupContextEngine({ maxMutatorPasses: 1 })
    await limited.seed({ title: 'x' })
    await limited.addMutator(
      'a_total.js',
      `export const subscriptions = ['count']
      export default (o, n) => ({ ...n, total: n.count * 10 })`
    )
    await limited.addMutator(
      'b_count.js',
      `export const subscriptions = ['title']
      export default (o, n) => ({ ...n, count: n.title.length })`
    )

    const response = await client.put('/context/title').json({ value: 'abc' })
    response.assertStatus(422)
    response.assertBodyContains({ code: 'E_MUTATOR_LOOP' })
    assert.sameMembers(response.body().mutators, ['a_total.js', 'b_count.js'])
    limited.cleanup()
  })

  test('rolls back when a mutator throws', async ({ client, assert }) => {
    await ctx.addMutator(
      'guard.js',
      `export const subscriptions = ['layers']
      export default () => { throw new Error('layers are locked') }`
    )

    const response = await client.put('/context/layers.0.name').json({ value: 'nope' })
    response.assertStatus(422)
    response.assertBodyContains({ code: 'E_MUTATOR_FAILED', mutator: 'guard.js' })

    const read = await client.get('/context/layers.0.name')
    read.assertBody({ path: 'layers.0.name', value: 'test' })
    const persisted = await readPersisted()
    assert.equal(persisted.layers[0].name, 'test')
  })

  test('rolls back when a mutator alters the previous context', async ({ client }) => {
    await ctx.addMutator(
      'sneaky.js',
      `export const subscriptions = ['title']
      export default (oldContext, newContext) => { oldContext.title = 'hacked'; return newContext }`
    )

    const write = await client.put('/context/title').json({ value: 'y' })
    write.assertStatus(422)
    const read = await client.get('/context/title')
    read.assertBody({ path: 'title', value: 'x' })
  })

  test('lists and reloads mutators', async ({ client }) => {
    await ctx.disk.put(
      'nested/noop.js',
      `export const subscriptions = ['a']\nexport default (o, n) => n`
    )
    await ctx.disk.put('readme.txt', 'ignored')

    const reload = await client.post('/mutators/reload')
    reload.assertStatus(200)
    reload.assertBody([{ name: 'nested/noop.js', subscriptions: ['a'] }])

    const read = await client.get('/mutators')
    read.assertBody([{ name: 'nested/noop.js', subscriptions: ['a'] }])
  })

  test('keeps the previous mutators when a reload fails', async ({ client }) => {
    await ctx.addMutator('ok.js', `export const subscriptions = []\nexport default (o, n) => n`)
    await ctx.disk.put('broken.js', `export const subscriptions = 'layers'\nexport default 1`)

    const append = await client.post('/mutators/reload')
    append.assertStatus(500)
    const read = await client.get('/mutators')
    read.assertBody([{ name: 'ok.js', subscriptions: [] }])
  })
})

test.group('context | validators', (group) => {
  let ctx: Awaited<ReturnType<typeof setupContextEngine>>

  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())
  group.each.setup(async () => {
    ctx = await setupContextEngine({
      validators: {
        'layers': { type: 'array' },
        'layers.*': {
          type: 'object',
          properties: { name: { type: 'string' }, value: { type: 'number' } },
          required: ['name', 'value'],
        },
      },
    })
    await ctx.seed({ layers: [{ name: 'test', value: 0 }] })
    return () => ctx.cleanup()
  })

  test('accepts updates that satisfy the schema', async ({ client }) => {
    const write = await client.put('/context/layers.0.value').json({ value: 3 })
    write.assertStatus(200)
  })

  test('rejects and rolls back updates that break the schema', async ({ client, assert }) => {
    const response = await client.put('/context/layers.0.value').json({ value: 'three' })
    response.assertStatus(422)
    response.assertBodyContains({
      code: 'E_CONTEXT_VALIDATION',
      errors: [{ path: 'layers.0', field: 'value', rule: 'type' }],
    })

    const read = await client.get('/context/layers.0.value')
    read.assertBody({ path: 'layers.0.value', value: 0 })
    const persisted = await readPersisted()
    assert.equal(persisted.layers[0].value, 0)
  })

  test('validates values produced by mutators', async ({ client }) => {
    await ctx.addMutator(
      'breaks.js',
      `export const subscriptions = ['title']
      export default (o, n) => ({ ...n, layers: 'oops' })`
    )

    const write = await client.put('/context/title').json({ value: 'y' })
    write.assertStatus(422)
    const read = await client.get('/context/title')
    read.assertStatus(404)
  })
})
