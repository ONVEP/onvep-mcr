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

const versions = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: count - i,
    createdAt: '2026-11-15T10:00:00.000+00:00',
    context: { title: `v${count - i}` },
  }))

test.group('Endpoint /context/versions', (group) => {
  let engine: FakeContextEngine

  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())
  group.each.setup(() => ensureBaseRoles())
  group.each.setup(() => {
    const { fake, restore } = fakeContextEngine()
    engine = fake
    return restore
  })

  test('GET sans permission de gestion est refusé', async ({ client }) => {
    const user = await UserFactory.create()
    await withPermissions(user, 'context-editor', [
      PERMISSIONS.contextView,
      PERMISSIONS.contextEdit,
    ])

    const response = await client.get('/context/versions').loginAs(user).redirects(0)
    assertForbiddenRedirect(response)
  })

  test('GET index redirige vers la version actuelle', async ({ client, assert }) => {
    engine.versions = versions(3)

    const response = await client
      .get('/context/versions')
      .loginAs(await admin())
      .redirects(0)

    assert.equal(response.header('location'), '/context/versions/3')
  })

  test('GET index sans historique rend la page vide', async ({ client, assert }) => {
    const response = await client
      .get('/context/versions')
      .loginAs(await admin())
      .withInertia()

    response.assertInertiaComponent('context/versions')
    assert.isNull(response.inertiaProps.version)
  })

  test('GET show rend la version et identifie la version actuelle', async ({ client, assert }) => {
    engine.versions = versions(3)

    const response = await client
      .get('/context/versions/1')
      .loginAs(await admin())
      .withInertia()

    assert.deepEqual(response.inertiaProps.version.context, { title: 'v1' })
    assert.equal(response.inertiaProps.latestId, 3)
  })

  test('GET show sur une autre page de la liste garde la version actuelle', async ({
    client,
    assert,
  }) => {
    engine.versions = versions(40)

    const response = await client
      .get('/context/versions/2')
      .qs({ page: 2 })
      .loginAs(await admin())
      .withInertia()

    assert.equal(response.inertiaProps.versions.meta.currentPage, 2)
    assert.equal(response.inertiaProps.latestId, 40)
  })

  test('POST restore recharge la version, avec ou sans mutators', async ({ client, assert }) => {
    const user = await admin()

    const response = await client
      .post('/context/versions/1/restore')
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)
      .json({ bypassMutators: true })
    await client
      .post('/context/versions/2/restore')
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)
      .json({})

    assert.equal(response.header('location'), '/context/versions')
    response.assertFlashMessage('success', 'Version #1 restored')
    assert.deepEqual(engine.callsTo('restoreVersion'), [
      [1, true],
      [2, false],
    ])
  })

  test('POST restore relaie un refus du moteur', async ({ client }) => {
    engine.rejectNext(422, 'The updated context does not satisfy its validators')

    const response = await client
      .post('/context/versions/1/restore')
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .json({})

    response.assertFlashMessage('error', 'The updated context does not satisfy its validators')
  })
})
