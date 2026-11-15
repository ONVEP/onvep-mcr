import testUtils from '@adonisjs/core/services/test_utils'
import transmit from '@adonisjs/transmit/services/main'
import { test } from '@japa/runner'
import sinon from 'sinon'

import { ROLES } from '#users/enums/role'
import { UserFactory } from '#users/database/factories/user'
import { LayerFactory } from '#graphics/database/factories/layers'
import Layer from '#graphics/models/layer'
import { assertForbiddenRedirect } from '#tests/helpers/http'
import { ensureBaseRoles, withRole } from '#tests/helpers/rbac'

async function admin() {
  const user = await UserFactory.create()
  await withRole(user, ROLES.ADMIN)
  return user
}

test.group('Endpoint /graphics', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())
  group.each.setup(() => ensureBaseRoles())

  test('GET sans auth redirige vers login', async ({ client, assert }) => {
    const response = await client.get('/graphics').redirects(0)
    response.assertStatus(302)
    assert.equal(response.header('location'), '/login')
  })

  test('GET sans permission est refusé', async ({ client }) => {
    const user = await UserFactory.create()
    await withRole(user, ROLES.USER)

    const response = await client.get('/graphics').loginAs(user).redirects(0)
    assertForbiddenRedirect(response)
  })

  test('GET index redirige vers le premier layer', async ({ client, assert }) => {
    await Layer.query().delete()
    const layer = await LayerFactory.merge({ name: 'AAA' }).create()

    const response = await client
      .get('/graphics')
      .loginAs(await admin())
      .redirects(0)
    response.assertStatus(302)
    assert.equal(response.header('location'), `/graphics/${layer.id}`)
  })

  test('GET show rend l’éditeur avec le contenu et le shell de preview', async ({
    client,
    assert,
  }) => {
    const layer = await LayerFactory.merge({ content: '<b>Hi</b>' }).create()

    const response = await client
      .get(`/graphics/${layer.id}`)
      .loginAs(await admin())
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('graphics/editor')
    assert.equal(response.inertiaProps.layer.content, '<b>Hi</b>')
    assert.include(response.inertiaProps.previewShell, response.inertiaProps.previewPlaceholder)
  })

  test('POST crée un layer avec un slug unique', async ({ client, assert }) => {
    await LayerFactory.merge({ name: 'Lower third', slug: 'lower-third' }).create()

    const response = await client
      .post('/graphics')
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .json({ name: 'Lower Third' })

    response.assertStatus(302)
    const created = await Layer.query().where('name', 'Lower Third').firstOrFail()
    assert.equal(created.slug, 'lower-third-2')
    assert.isTrue(created.enabled)
    assert.equal(response.header('location'), `/graphics/${created.id}`)
  })

  test('PUT partiel: renommer garde le slug et le contenu', async ({ client, assert }) => {
    const layer = await LayerFactory.merge({ slug: 'score', content: '<i>1-0</i>' }).create()

    await client
      .put(`/graphics/${layer.id}`)
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .json({ name: 'Scoreboard' })

    await layer.refresh()
    assert.equal(layer.name, 'Scoreboard')
    assert.equal(layer.slug, 'score')
    assert.equal(layer.content, '<i>1-0</i>')
  })

  test('PUT accepte un contenu vide et désactive le layer', async ({ client, assert }) => {
    const layer = await LayerFactory.create()

    await client
      .put(`/graphics/${layer.id}`)
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .json({ content: '', enabled: false })

    await layer.refresh()
    assert.equal(layer.content, '')
    assert.isFalse(layer.enabled)
  })

  test('DELETE supprime le layer', async ({ client, assert }) => {
    const layer = await LayerFactory.create()

    const response = await client
      .delete(`/graphics/${layer.id}`)
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
    assert.isNull(await Layer.find(layer.id))
  })

  test('GET tailwind-classes renvoie la liste des classes', async ({ client, assert }) => {
    const response = await client
      .get('/graphics/tailwind-classes')
      .loginAs(await admin())
      .accept('json')

    response.assertStatus(200)
    assert.includeMembers(response.body(), ['flex', 'absolute', 'inset-0'])
  })
})

test.group('Endpoint /cg', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('GET /cg/layer/:slug est public et contient le contenu brut', async ({ client, assert }) => {
    await LayerFactory.merge({ slug: 'bug', content: '<div class="p-4">LIVE</div>' }).create()

    const response = await client.get('/cg/layer/bug')

    response.assertStatus(200)
    assert.include(response.text(), '<div class="cg-layer" data-layer="bug">')
    assert.include(response.text(), '<div class="p-4">LIVE</div>')
    assert.include(response.text(), '/cg/assets/tailwind.js')
  })

  test('GET /cg/all ne contient que les layers activés', async ({ client, assert }) => {
    await LayerFactory.merge({ slug: 'on-air', content: 'ON' }).create()
    await LayerFactory.merge({ slug: 'off-air', content: 'OFF', enabled: false }).create()

    const response = await client.get('/cg/all')

    response.assertStatus(200)
    assert.include(response.text(), 'data-layer="on-air"')
    assert.notInclude(response.text(), 'data-layer="off-air"')
  })

  test('GET /cg/layer/:slug inconnu retourne 404', async ({ client }) => {
    const response = await client.get('/cg/layer/nope')
    response.assertStatus(404)
  })

  test('GET /cg/assets/tailwind.js sert le runtime Tailwind', async ({ client, assert }) => {
    const response = await client.get('/cg/assets/tailwind.js')
    response.assertStatus(200)
    assert.include(response.header('content-type'), 'javascript')
  })
})

test.group('Rechargement des pages CG', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())
  group.each.setup(() => ensureBaseRoles())
  group.each.teardown(() => sinon.restore())

  test('les pages /cg embarquent le rechargement, pas le shell de preview', async ({
    client,
    assert,
  }) => {
    const layer = await LayerFactory.merge({ slug: 'lower-third' }).create()

    const page = await client.get('/cg/layer/lower-third')
    assert.include(page.text(), 'data-slug="lower-third"')
    assert.include(page.text(), "import { Transmit } from '/cg/assets/transmit.js'")

    const editor = await client
      .get(`/graphics/${layer.id}`)
      .loginAs(await admin())
      .withInertia()
    assert.notInclude(editor.inertiaProps.previewShell, 'data-slug')
  })

  test('GET /cg/assets/ctx.js sert le runtime ctx-*, chargeable depuis la preview', async ({
    client,
    assert,
  }) => {
    const response = await client.get('/cg/assets/ctx.js')

    response.assertStatus(200)
    assert.include(response.header('content-type'), 'javascript')
    // The editor preview is a sandboxed iframe: its module imports are cross-origin.
    assert.equal(response.header('access-control-allow-origin'), '*')
    assert.include(response.text(), 'ctx-source')
  })

  test('les pages CG et la preview chargent le runtime ctx-* avec l’URL du context engine', async ({
    client,
    assert,
  }) => {
    const layer = await LayerFactory.merge({ slug: 'bound' }).create()

    const page = await client.get('/cg/layer/bound')
    assert.match(page.text(), /<meta name="ctx-engine" content="http[^"]+"/)
    assert.include(page.text(), '<script type="module" src="/cg/assets/ctx.js"></script>')

    const editor = await client
      .get(`/graphics/${layer.id}`)
      .loginAs(await admin())
      .withInertia()
    assert.include(editor.inertiaProps.previewShell, '/cg/assets/ctx.js')
  })

  test('GET /cg/assets/transmit.js sert le client Transmit', async ({ client, assert }) => {
    const response = await client.get('/cg/assets/transmit.js')

    response.assertStatus(200)
    assert.include(response.header('content-type'), 'javascript')
    assert.include(response.text(), 'var Transmit = class')
  })

  test('enregistrer un layer prévient ses pages CG', async ({ client, assert }) => {
    const broadcast = sinon.stub(transmit, 'broadcast')
    const layer = await LayerFactory.merge({ slug: 'bug' }).create()

    await client
      .put(`/graphics/${layer.id}`)
      .withCsrfToken()
      .json({ content: '<b>Live</b>' })
      .loginAs(await admin())
      .redirects(0)

    assert.isTrue(broadcast.calledWith('cg', { slugs: ['bug'] }))
  })
})
