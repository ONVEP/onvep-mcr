import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { setupContextEngine } from '#tests/helpers/context'

test.group('context | versions', (group) => {
  let ctx: Awaited<ReturnType<typeof setupContextEngine>>

  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())
  group.each.setup(async () => {
    ctx = await setupContextEngine()
    return () => ctx.cleanup()
  })

  test('records one version per committed update', async ({ client, assert }) => {
    const first = await ctx.engine.set('title', 'a')
    const second = await ctx.engine.set('title', 'b')
    const noop = await ctx.engine.set('title', 'b')

    assert.isBelow(first.version!, second.version!)
    assert.isUndefined(noop.version)

    const response = await client.get('/versions')
    response.assertStatus(200)
    const { meta, data } = response.body()
    assert.equal(meta.total, 2)
    assert.deepEqual(
      data.map((version: { id: number }) => version.id),
      [second.version, first.version]
    )
    assert.properties(data[0], ['id', 'createdAt'])
    assert.notProperty(data[0], 'context')
  })

  test('paginates the history', async ({ client, assert }) => {
    for (const title of ['a', 'b', 'c']) await ctx.engine.set('title', title)

    const response = await client.get('/versions').qs({ page: 2, perPage: 2 })
    const { meta, data } = response.body()
    assert.equal(meta.lastPage, 2)
    assert.lengthOf(data, 1)
  })

  test('shows a version with its content', async ({ client }) => {
    const { version } = await ctx.engine.set('title', 'a')

    const response = await client.get(`/versions/${version}`)
    response.assertStatus(200)
    response.assertBodyContains({ id: version, context: { title: 'a' } })
  })

  test('returns 404 for an unknown version', async ({ client }) => {
    const response = await client.get('/versions/999999')
    response.assertStatus(404)
    response.assertBodyContains({ code: 'E_VERSION_NOT_FOUND' })
  })

  test('restores a version as a new version, through mutators', async ({ client, assert }) => {
    await ctx.addMutator(
      'stamp.js',
      `export const subscriptions = ['title']
      export default (o, n) => ({ ...n, stamped: n.title })`
    )
    const { version } = await ctx.engine.set('title', 'a')
    await ctx.engine.set('title', 'b')

    const response = await client.post(`/versions/${version}/restore`)
    response.assertStatus(200)
    const body = response.body()
    assert.isAbove(body.version, version!)
    assert.deepEqual(body.value, { title: 'a', stamped: 'a' })
  })

  test('restores a version as-is when bypassing mutators', async ({ client }) => {
    const { version } = await ctx.engine.set('title', 'a')
    await ctx.addMutator(
      'stamp.js',
      `export const subscriptions = ['title']
      export default (o, n) => ({ ...n, stamped: n.title })`
    )
    await ctx.engine.set('title', 'b')

    const response = await client
      .post(`/versions/${version}/restore`)
      .json({ bypassMutators: true })
    response.assertStatus(200)
    response.assertBodyContains({ value: { title: 'a' } })

    const read = await client.get('/context/stamped')
    read.assertStatus(404)
  })

  test('still runs validators on restore', async ({ client }) => {
    const { version } = await ctx.engine.set('title', 42)
    await ctx.engine.set('title', 'ok')

    const strict = await setupContextEngine({
      validators: { title: { type: 'string' } },
    })
    const response = await client
      .post(`/versions/${version}/restore`)
      .json({ bypassMutators: true })
    response.assertStatus(422)
    response.assertBodyContains({ code: 'E_CONTEXT_VALIDATION' })

    const read = await client.get('/context/title')
    read.assertBody({ path: 'title', value: 'ok' })
    strict.cleanup()
  })

  test('reboots on the restored version', async ({ client }) => {
    const { version } = await ctx.engine.set('title', 'a')
    await ctx.engine.set('title', 'b')
    await ctx.engine.restore(version!)

    const rebooted = await setupContextEngine()
    const read = await client.get('/context/title')
    read.assertBody({ path: 'title', value: 'a' })
    rebooted.cleanup()
  })
})
