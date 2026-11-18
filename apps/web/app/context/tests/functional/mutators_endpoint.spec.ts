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

const MUTATOR = {
  name: 'layers/sync.js',
  subscriptions: ['layers'],
  enabled: true,
  source: 'export const subscriptions = ["layers"]\nexport default (o, n) => n',
}

test.group('Endpoint /context/mutators', (group) => {
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

    const response = await client.get('/context/mutators').loginAs(user).redirects(0)
    assertForbiddenRedirect(response)
  })

  test('GET index redirige vers le premier mutator (nom encodé)', async ({ client, assert }) => {
    engine.mutators = [MUTATOR]

    const response = await client
      .get('/context/mutators')
      .loginAs(await admin())
      .redirects(0)

    response.assertStatus(302)
    assert.equal(response.header('location'), '/context/mutators/layers%2Fsync.js')
  })

  test('GET index sans mutator rend la page vide', async ({ client, assert }) => {
    const response = await client
      .get('/context/mutators')
      .loginAs(await admin())
      .withInertia()

    response.assertInertiaComponent('context/mutators')
    assert.isNull(response.inertiaProps.mutator)
  })

  test('GET show décode le nom et rend la source', async ({ client, assert }) => {
    engine.mutators = [MUTATOR]

    const response = await client
      .get('/context/mutators/layers%2Fsync.js')
      .loginAs(await admin())
      .withInertia()

    response.assertStatus(200)
    assert.equal(response.inertiaProps.mutator.source, MUTATOR.source)
    assert.deepEqual(engine.callsTo('getMutator'), [['layers/sync.js']])
  })

  test("POST crée le mutator à partir d'un modèle et ajoute .js", async ({ client, assert }) => {
    const response = await client
      .post('/context/mutators')
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .json({ name: 'layers/sync' })

    response.assertStatus(302)
    const [[name, source]] = engine.callsTo('saveMutator') as [string, string][]
    assert.equal(name, 'layers/sync.js')
    assert.include(source, 'export const subscriptions = []')
  })

  test('POST refuse un nom invalide', async ({ client, assert }) => {
    await client
      .post('/context/mutators')
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .json({ name: '../escape' })

    assert.lengthOf(engine.callsTo('saveMutator'), 0)
  })

  test('PUT enregistre la source, une source vidée devient ""', async ({ client, assert }) => {
    await client
      .put('/context/mutators/layers%2Fsync.js')
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .json({ source: '' })

    assert.deepEqual(engine.callsTo('saveMutator'), [['layers/sync.js', '']])
  })

  test('PUT relaie le code refusé par le moteur', async ({ client }) => {
    engine.rejectNext(422, 'Cannot import mutator "x.js"')

    const response = await client
      .put('/context/mutators/x.js')
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .json({ source: 'export default (' })

    response.assertFlashMessage('error', 'Cannot import mutator "x.js"')
  })

  test("DELETE supprime et revient à l'index", async ({ client, assert }) => {
    const response = await client
      .delete('/context/mutators/x.js')
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)

    assert.equal(response.header('location'), '/context/mutators')
    assert.deepEqual(engine.callsTo('deleteMutator'), [['x.js']])
  })

  test("PUT state active ou désactive le mutator et revient sur l'éditeur", async ({
    client,
    assert,
  }) => {
    const response = await client
      .put('/context/mutators/layers%2Fsync.js/state')
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .json({ enabled: false })

    response.assertStatus(302)
    assert.equal(response.header('location'), '/context/mutators/layers%2Fsync.js')
    assert.deepEqual(engine.callsTo('setMutatorEnabled'), [['layers/sync.js', false]])
  })

  test("POST run exécute le mutator et revient sur l'éditeur", async ({ client, assert }) => {
    const response = await client
      .post('/context/mutators/layers%2Fsync.js/run')
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
    assert.equal(response.header('location'), '/context/mutators/layers%2Fsync.js')
    response.assertFlashMessage('success', 'Mutator run: 1 change')
    assert.deepEqual(engine.callsTo('runMutator'), [['layers/sync.js']])
  })

  test('POST run relaie le refus du moteur', async ({ client }) => {
    engine.rejectNext(422, 'Mutator "x.js" rejected the update: boom')

    const response = await client
      .post('/context/mutators/x.js/run')
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)

    response.assertFlashMessage('error', 'Mutator "x.js" rejected the update: boom')
  })

  test('POST run sans la permission manage est refusé', async ({ client, assert }) => {
    const user = await UserFactory.create()
    await withPermissions(user, 'context-editor', [
      PERMISSIONS.contextView,
      PERMISSIONS.contextEdit,
    ])

    const response = await client
      .post('/context/mutators/x.js/run')
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)

    assertForbiddenRedirect(response)
    assert.lengthOf(engine.callsTo('runMutator'), 0)
  })

  test('PUT state sans la permission manage est refusé', async ({ client, assert }) => {
    const user = await UserFactory.create()
    await withPermissions(user, 'context-editor', [
      PERMISSIONS.contextView,
      PERMISSIONS.contextEdit,
    ])

    const response = await client
      .put('/context/mutators/x.js/state')
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)
      .json({ enabled: false })

    assertForbiddenRedirect(response)
    assert.lengthOf(engine.callsTo('setMutatorEnabled'), 0)
  })
})
