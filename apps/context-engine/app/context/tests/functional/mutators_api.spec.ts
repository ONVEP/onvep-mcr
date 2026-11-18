import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { setupContextEngine } from '#tests/helpers/context'

const SOURCE = `export const subscriptions = ['title']
export default (o, n) => ({ ...n, upper: n.title.toUpperCase() })`

test.group('mutators | api', (group) => {
  let ctx: Awaited<ReturnType<typeof setupContextEngine>>

  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())
  group.each.setup(async () => {
    ctx = await setupContextEngine()
    await ctx.seed({ title: 'x' })
    return () => ctx.cleanup()
  })

  test('writes a mutator and runs it right away', async ({ client }) => {
    const write = await client.put('/mutators/upper.js').json({ source: SOURCE })
    write.assertStatus(200)
    write.assertBody([{ name: 'upper.js', subscriptions: ['title'], enabled: true }])

    await client.put('/context/title').json({ value: 'abc' })
    const read = await client.get('/context/upper')
    read.assertBody({ path: 'upper', value: 'ABC' })
  })

  test('reads a mutator source, including nested names', async ({ client }) => {
    await client.put('/mutators/folder/upper.js').json({ source: SOURCE })

    const response = await client.get('/mutators/folder/upper.js')
    response.assertBody({
      name: 'folder/upper.js',
      subscriptions: ['title'],
      enabled: true,
      source: SOURCE,
    })
  })

  test('refuses broken sources without touching the disk', async ({ client, assert }) => {
    const syntax = await client.put('/mutators/broken.js').json({ source: 'export default (' })
    syntax.assertStatus(422)
    syntax.assertBodyContains({ code: 'E_INVALID_MUTATOR' })

    const shape = await client.put('/mutators/broken.js').json({ source: 'export default 1' })
    shape.assertStatus(422)

    const subscription = await client
      .put('/mutators/broken.js')
      .json({ source: `export const subscriptions = ['a..b']\nexport default (o, n) => n` })
    subscription.assertStatus(422)

    assert.isFalse(await ctx.disk.exists('broken.js'))
  })

  test('refuses invalid names', async ({ client }) => {
    const response = await client.put('/mutators/no-extension').json({ source: SOURCE })
    response.assertStatus(422)
  })

  test('deletes a mutator', async ({ client }) => {
    await client.put('/mutators/upper.js').json({ source: SOURCE })

    const removal = await client.delete('/mutators/upper.js')
    removal.assertBody([])

    const missing = await client.get('/mutators/upper.js')
    missing.assertStatus(404)
    const missingDelete = await client.delete('/mutators/upper.js')
    missingDelete.assertStatus(404)
  })

  test('a disabled mutator stays listed but no longer runs', async ({ client }) => {
    await client.put('/mutators/upper.js').json({ source: SOURCE })

    const disabled = await client.put('/mutator-states/upper.js').json({ enabled: false })
    disabled.assertStatus(200)
    disabled.assertBody([{ name: 'upper.js', subscriptions: ['title'], enabled: false }])

    await client.put('/context/title').json({ value: 'abc' })
    const untouched = await client.get('/context/upper')
    untouched.assertStatus(404)

    await client.put('/mutator-states/upper.js').json({ enabled: true })
    await client.put('/context/title').json({ value: 'def' })
    const read = await client.get('/context/upper')
    read.assertBody({ path: 'upper', value: 'DEF' })
  })

  test('the state survives a source update but not a deletion', async ({ client }) => {
    await client.put('/mutators/upper.js').json({ source: SOURCE })
    await client.put('/mutator-states/upper.js').json({ enabled: false })

    const rewritten = await client.put('/mutators/upper.js').json({ source: SOURCE })
    rewritten.assertBody([{ name: 'upper.js', subscriptions: ['title'], enabled: false }])

    await client.delete('/mutators/upper.js')
    const recreated = await client.put('/mutators/upper.js').json({ source: SOURCE })
    recreated.assertBody([{ name: 'upper.js', subscriptions: ['title'], enabled: true }])
  })

  test('toggling an unknown mutator is a 404', async ({ client }) => {
    const response = await client.put('/mutator-states/missing.js').json({ enabled: false })
    response.assertStatus(404)
  })

  test('runs a mutator on demand, without any change, then cascades', async ({ client }) => {
    await ctx.seed({ title: 'abc', upper: 'stale' })
    await client.put('/mutators/a/upper.js').json({ source: SOURCE })
    await client.put('/mutators/b/count.js').json({
      source: `export const subscriptions = ['upper']
export default (o, n) => ({ ...n, length: n.upper.length })`,
    })

    const run = await client.post('/mutator-runs/a/upper.js')
    run.assertStatus(200)
    run.assertBodyContains({ changes: ['length', 'upper'] })

    const read = await client.get('/context')
    read.assertBody({ path: '', value: { title: 'abc', upper: 'ABC', length: 3 } })
  })

  test('runs a disabled mutator on demand', async ({ client }) => {
    await client.put('/mutators/upper.js').json({ source: SOURCE })
    await client.put('/mutator-states/upper.js').json({ enabled: false })

    await client.post('/mutator-runs/upper.js')
    const read = await client.get('/context/upper')
    read.assertBody({ path: 'upper', value: 'X' })
  })

  test('a run that changes nothing records no version', async ({ client, assert }) => {
    await client.put('/mutators/noop.js').json({
      source: `export const subscriptions = []\nexport default (o, n) => n`,
    })

    const run = await client.post('/mutator-runs/noop.js')
    run.assertStatus(200)
    assert.notProperty(run.body(), 'version')
    assert.deepEqual(run.body().changes, [])
  })

  test('running an unknown mutator is a 404', async ({ client }) => {
    const response = await client.post('/mutator-runs/missing.js')
    response.assertStatus(404)
  })
})
