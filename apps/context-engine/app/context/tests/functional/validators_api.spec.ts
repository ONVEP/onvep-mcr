import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { setupContextEngine } from '#tests/helpers/context'

const layerSchema = {
  type: 'object',
  properties: { name: { type: 'string', minLength: 1 } },
  required: ['name'],
}

test.group('validators | api', (group) => {
  let ctx: Awaited<ReturnType<typeof setupContextEngine>>

  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())
  group.each.setup(async () => {
    ctx = await setupContextEngine()
    await ctx.seed({ layers: [{ name: 'test' }] })
    return () => ctx.cleanup()
  })

  test('creates a validator applied to subsequent updates', async ({ client }) => {
    const created = await client.post('/validators').json({ path: 'layers.*', schema: layerSchema })
    created.assertStatus(201)
    created.assertBodyContains({ path: 'layers.*', schema: layerSchema })

    const rejected = await client.put('/context/layers.0.name').json({ value: '' })
    rejected.assertStatus(422)
    rejected.assertBodyContains({
      code: 'E_CONTEXT_VALIDATION',
      errors: [{ path: 'layers.0', field: 'name', rule: 'minLength' }],
    })
  })

  test('reports missing required properties on their own field', async ({ client }) => {
    await client.post('/validators').json({ path: 'layers.*', schema: layerSchema })

    const response = await client.put('/context/layers.0').json({ value: {} })
    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'name', rule: 'required' }] })
  })

  test('lists, shows, updates and deletes validators', async ({ client, assert }) => {
    const created = await client.post('/validators').json({ path: 'layers.*', schema: layerSchema })
    const { id } = created.body()

    const list = await client.get('/validators')
    assert.deepEqual(
      list.body().map((validator: { path: string }) => validator.path),
      ['layers.*']
    )

    const updated = await client
      .put(`/validators/${id}`)
      .json({ path: 'layers.*.name', schema: { type: 'string' } })
    updated.assertBodyContains({ id, path: 'layers.*.name' })

    const shown = await client.get(`/validators/${id}`)
    shown.assertBodyContains({ schema: { type: 'string' } })

    const removed = await client.delete(`/validators/${id}`)
    removed.assertStatus(204)
    const missing = await client.get(`/validators/${id}`)
    missing.assertStatus(404)

    // Deleted validators no longer apply.
    const write = await client.put('/context/layers.0.name').json({ value: 1 })
    write.assertStatus(200)
  })

  test('rejects invalid schemas, paths and duplicates', async ({ client }) => {
    const unknownKeyword = await client
      .post('/validators')
      .json({ path: 'layers', schema: { type: 'array', minimumItems: 1 } })
    unknownKeyword.assertStatus(422)
    unknownKeyword.assertBodyContains({ code: 'E_INVALID_VALIDATOR' })

    const badPath = await client.post('/validators').json({ path: 'a..b', schema: {} })
    badPath.assertStatus(422)

    await client.post('/validators').json({ path: 'layers', schema: { type: 'array' } })
    const duplicate = await client.post('/validators').json({ path: 'layers', schema: {} })
    duplicate.assertStatus(422)
  })

  test('supports string formats', async ({ client }) => {
    await client
      .post('/validators')
      .json({ path: 'email', schema: { type: 'string', format: 'email' } })

    const rejected = await client.put('/context/email').json({ value: 'nope' })
    rejected.assertStatus(422)
    const accepted = await client.put('/context/email').json({ value: 'a@b.co' })
    accepted.assertStatus(200)
  })
})
