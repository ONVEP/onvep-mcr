import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

import { UserFactory } from '#users/database/factories/user'
import { ROLES } from '#users/enums/role'
import { fakeContextEngine, type FakeContextEngine } from '#tests/helpers/context_engine'
import { assertForbiddenRedirect } from '#tests/helpers/http'
import { ensureBaseRoles, withRole } from '#tests/helpers/rbac'

async function admin() {
  const user = await UserFactory.create()
  await withRole(user, ROLES.ADMIN)
  return user
}

const VALIDATOR = {
  id: 7,
  path: 'layers.*',
  schema: { type: 'object', properties: { name: { type: 'string' } } },
  createdAt: '',
  updatedAt: '',
}

test.group('Endpoint /context/validators', (group) => {
  let engine: FakeContextEngine

  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())
  group.each.setup(() => ensureBaseRoles())
  group.each.setup(() => {
    const { fake, restore } = fakeContextEngine()
    engine = fake
    return restore
  })

  test('GET sans permission est refusé', async ({ client }) => {
    const user = await UserFactory.create()
    await withRole(user, ROLES.USER)

    const response = await client.get('/context/validators').loginAs(user).redirects(0)
    assertForbiddenRedirect(response)
  })

  test('GET index redirige vers le premier validator', async ({ client, assert }) => {
    engine.validators = [VALIDATOR]

    const response = await client
      .get('/context/validators')
      .loginAs(await admin())
      .redirects(0)

    assert.equal(response.header('location'), '/context/validators/7')
  })

  test('GET show rend le validator', async ({ client, assert }) => {
    engine.validators = [VALIDATOR]

    const response = await client
      .get('/context/validators/7')
      .loginAs(await admin())
      .withInertia()

    response.assertInertiaComponent('context/validators')
    assert.deepEqual(response.inertiaProps.validator.schema, VALIDATOR.schema)
  })

  test('POST crée un validator avec un schéma vide', async ({ client, assert }) => {
    const response = await client
      .post('/context/validators')
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .json({ path: 'layers.*' })

    assert.equal(response.header('location'), '/context/validators/42')
    assert.deepEqual(engine.callsTo('createValidator'), [[{ path: 'layers.*', schema: {} }]])
  })

  test('PUT décode le schéma, chaînes vides comprises', async ({ client, assert }) => {
    const schema = { type: 'string', enum: ['', 'live'] }

    await client
      .put('/context/validators/7')
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .json({ path: 'status', schema: JSON.stringify(schema) })

    assert.deepEqual(engine.callsTo('updateValidator'), [[7, { path: 'status', schema }]])
  })

  test('PUT relaie un schéma refusé par le moteur', async ({ client }) => {
    engine.rejectNext(422, 'Invalid JSON Schema: unknown keyword')

    const response = await client
      .put('/context/validators/7')
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .json({ path: 'a', schema: '{"minimumItems": 1}' })

    response.assertFlashMessage('error', 'Invalid JSON Schema: unknown keyword')
  })

  test('DELETE supprime le validator', async ({ client, assert }) => {
    const response = await client
      .delete('/context/validators/7')
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)

    assert.equal(response.header('location'), '/context/validators')
    assert.deepEqual(engine.callsTo('deleteValidator'), [[7]])
  })
})
