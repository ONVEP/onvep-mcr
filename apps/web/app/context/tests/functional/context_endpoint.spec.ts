import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

import { UserFactory } from '#users/database/factories/user'
import { PERMISSIONS } from '#users/enums/permission'
import { ROLES } from '#users/enums/role'
import { fakeContextEngine, type FakeContextEngine } from '#tests/helpers/context_engine'
import { assertForbiddenRedirect } from '#tests/helpers/http'
import { ensureBaseRoles, withPermissions, withRole } from '#tests/helpers/rbac'

async function admin() {
  const user = await UserFactory.create()
  await withRole(user, ROLES.ADMIN)
  return user
}

async function viewer() {
  const user = await UserFactory.create()
  await withPermissions(user, 'context-viewer', [PERMISSIONS.contextView])
  return user
}

test.group('Endpoint /context', (group) => {
  let engine: FakeContextEngine

  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())
  group.each.setup(() => ensureBaseRoles())
  group.each.setup(() => {
    const { fake, restore } = fakeContextEngine()
    engine = fake
    return restore
  })

  test('GET sans auth redirige vers login', async ({ client, assert }) => {
    const response = await client.get('/context').redirects(0)
    response.assertStatus(302)
    assert.equal(response.header('location'), '/login')
  })

  test('GET sans permission est refusé', async ({ client }) => {
    const user = await UserFactory.create()
    await withRole(user, ROLES.USER)

    const response = await client.get('/context').loginAs(user).redirects(0)
    assertForbiddenRedirect(response)
  })

  test("GET rend l'explorateur avec le contexte et l'URL SSE", async ({ client, assert }) => {
    engine.context = { layers: [{ name: 'test' }] }

    const response = await client
      .get('/context')
      .loginAs(await viewer())
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('context/explorer')
    assert.deepEqual(response.inertiaProps.context, { layers: [{ name: 'test' }] })
    assert.isString(response.inertiaProps.engineUrl)
  })

  test("GET rend l'explorateur même si le moteur est injoignable", async ({ client, assert }) => {
    engine.goOffline()

    const response = await client
      .get('/context')
      .loginAs(await viewer())
      .withInertia()

    response.assertStatus(200)
    assert.isNull(response.inertiaProps.context)
  })

  test('PUT values transmet la valeur décodée au moteur', async ({ client, assert }) => {
    const response = await client
      .put('/context/values')
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .json({ path: 'layers.0.name', value: JSON.stringify('') })

    response.assertStatus(302)
    assert.deepEqual(engine.callsTo('setValue'), [['layers.0.name', '']])
  })

  test('PUT values sur la racine', async ({ client, assert }) => {
    await client
      .put('/context/values')
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .json({ path: '', value: JSON.stringify({ a: 1 }) })

    assert.deepEqual(engine.callsTo('setValue'), [['', { a: 1 }]])
  })

  test('PUT values refuse un JSON invalide', async ({ client, assert }) => {
    const response = await client
      .put('/context/values')
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .json({ path: 'a', value: '{nope' })

    response.assertStatus(302)
    assert.lengthOf(engine.callsTo('setValue'), 0)
  })

  test("PUT values sans permission d'édition est refusé", async ({ client, assert }) => {
    const response = await client
      .put('/context/values')
      .loginAs(await viewer())
      .withCsrfToken()
      .redirects(0)
      .json({ path: 'a', value: '1' })

    assertForbiddenRedirect(response)
    assert.lengthOf(engine.calls, 0)
  })

  test('PUT values relaie le refus du moteur en message flash', async ({ client }) => {
    engine.rejectNext(422, 'The updated context does not satisfy its validators')

    const response = await client
      .put('/context/values')
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .json({ path: 'a', value: '1' })

    response.assertStatus(302)
    response.assertFlashMessage('error', 'The updated context does not satisfy its validators')
  })

  test('POST values ajoute un élément, DELETE values supprime', async ({ client, assert }) => {
    const user = await admin()
    await client
      .post('/context/values')
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)
      .json({ path: 'layers', value: 'null' })
    await client
      .delete('/context/values')
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)
      .json({ path: 'layers.0' })

    assert.deepEqual(engine.callsTo('appendValue'), [['layers', null]])
    assert.deepEqual(engine.callsTo('removeValue'), [['layers.0']])
  })
})
