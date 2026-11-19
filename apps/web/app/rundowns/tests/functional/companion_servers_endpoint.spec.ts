import app from '@adonisjs/core/services/app'
import type { HttpContext } from '@adonisjs/core/http'
import transmit from '@adonisjs/transmit/services/main'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

import { ROLES } from '#users/enums/role'
import { PERMISSIONS } from '#users/enums/permission'
import { UserFactory } from '#users/database/factories/user'
import { CompanionServerFactory } from '#rundowns/database/factories/rundowns'
import CompanionServer from '#rundowns/models/companion_server'
import { CompanionLive } from '#rundowns/services/companion_live'
import type { CompanionSnapshot } from '#rundowns/types/companion'
import { assertForbiddenRedirect } from '#tests/helpers/http'
import { ensureBaseRoles, withPermissions, withRole } from '#tests/helpers/rbac'

async function admin() {
  const user = await UserFactory.create()
  await withRole(user, ROLES.ADMIN)
  return user
}

class FakeCompanionLive extends CompanionLive {
  refreshed: number[] = []
  removed: number[] = []

  override async snapshot(): Promise<CompanionSnapshot> {
    return {
      seq: 1,
      status: { seq: 1, connected: true, error: null },
      pages: { seq: 1, list: [{ id: 'tech', number: 2, name: 'TECH', buttonCount: 1 }] },
      buttons: [
        {
          seq: 1,
          pageId: 'tech',
          page: 2,
          row: 0,
          column: 1,
          image: 'data:image/png;base64,AAA',
          controlType: 'button-layered',
          textSource: '$(internal:date_iso)',
          text: '2026-11-19',
          textError: null,
        },
      ],
    }
  }

  override refresh(server: CompanionServer) {
    this.refreshed.push(server.id)
  }

  override remove(serverId: number) {
    this.removed.push(serverId)
  }
}

test.group('Endpoint /rundowns/companion-servers', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())
  group.each.setup(() => ensureBaseRoles())

  let live: FakeCompanionLive
  group.each.setup(() => {
    live = new FakeCompanionLive()
    app.container.swap(CompanionLive, () => live)
    return () => app.container.restore(CompanionLive)
  })

  test('GET sans auth redirige vers login', async ({ client, assert }) => {
    const response = await client.get('/rundowns/companion-servers').redirects(0)
    response.assertStatus(302)
    assert.equal(response.header('location'), '/login')
  })

  test('GET avec rundowns.manage seul est refusé', async ({ client }) => {
    const user = await UserFactory.create()
    await withPermissions(user, 'editor', [PERMISSIONS.rundownsManage])

    const response = await client.get('/rundowns/companion-servers').loginAs(user).redirects(0)
    assertForbiddenRedirect(response)
  })

  test('GET en admin liste les serveurs', async ({ client, assert }) => {
    await CompanionServerFactory.merge({ name: 'Régie', url: 'http://10.0.0.1:8000' }).create()

    const response = await client
      .get('/rundowns/companion-servers')
      .loginAs(await admin())
      .withInertia()
    response.assertStatus(200)
    response.assertInertiaComponent('rundowns/companion_servers/index')
    assert.deepInclude(
      response.inertiaProps.companionServers.map((s: { name: string; url: string }) => ({
        name: s.name,
        url: s.url,
      })),
      { name: 'Régie', url: 'http://10.0.0.1:8000' }
    )
  })

  test('POST crée un serveur', async ({ client, assert }) => {
    const response = await client
      .post('/rundowns/companion-servers')
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .json({ name: 'Régie', url: 'http://companion.local:8000' })

    response.assertStatus(302)
    const server = await CompanionServer.findByOrFail('name', 'Régie')
    assert.deepEqual(server.technicalPages, [])
  })

  test('POST avec une URL invalide retourne 422', async ({ client }) => {
    const response = await client
      .post('/rundowns/companion-servers')
      .loginAs(await admin())
      .withCsrfToken()
      .accept('json')
      .redirects(0)
      .json({ name: 'Régie', url: 'ftp://companion' })

    response.assertStatus(422)
  })

  test('PUT enregistre les pages techniques', async ({ client, assert }) => {
    const server = await CompanionServerFactory.merge({ name: 'Régie' }).create()

    const response = await client
      .put(`/rundowns/companion-servers/${server.id}`)
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .json({ name: 'Régie', url: server.url, technicalPages: ['tech', 'main'] })

    response.assertStatus(302)
    await server.refresh()
    assert.deepEqual(server.technicalPages, ['tech', 'main'])
    assert.deepEqual(live.refreshed, [server.id])
  })

  test('PUT sans pages techniques conserve la sélection', async ({ client, assert }) => {
    const server = await CompanionServerFactory.merge({ technicalPages: ['tech'] }).create()

    await client
      .put(`/rundowns/companion-servers/${server.id}`)
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .json({ name: 'Renommé', url: server.url })

    await server.refresh()
    assert.equal(server.name, 'Renommé')
    assert.deepEqual(server.technicalPages, ['tech'])
  })

  test('GET show rend l’état live de Companion et son canal', async ({ client, assert }) => {
    const server = await CompanionServerFactory.create()

    const response = await client
      .get(`/rundowns/companion-servers/${server.id}`)
      .loginAs(await admin())
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('rundowns/companion_servers/show')
    assert.equal(response.inertiaProps.channel, `companion_servers/${server.id}`)
    assert.equal(response.inertiaProps.live.pages.list[0].id, 'tech')
    assert.equal(response.inertiaProps.live.buttons[0].image, 'data:image/png;base64,AAA')
    assert.equal(response.inertiaProps.live.buttons[0].text, '2026-11-19')
  })

  test('DELETE supprime un serveur', async ({ client, assert }) => {
    const server = await CompanionServerFactory.create()

    const response = await client
      .delete(`/rundowns/companion-servers/${server.id}`)
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
    assert.isNull(await CompanionServer.find(server.id))
    assert.deepEqual(live.removed, [server.id])
  })

  test('le canal live est réservé aux gestionnaires des serveurs Companion', async ({ assert }) => {
    const editor = await UserFactory.create()
    await withPermissions(editor, 'editor', [PERMISSIONS.rundownsManage])
    const contextOf = (current: typeof editor | null) =>
      ({ auth: { check: async () => {}, user: current } }) as unknown as HttpContext
    const manager = transmit.getManager()

    assert.isFalse(await manager.verifyAccess('companion_servers/1', contextOf(null)))
    assert.isFalse(await manager.verifyAccess('companion_servers/1', contextOf(editor)))
    assert.isTrue(await manager.verifyAccess('companion_servers/1', contextOf(await admin())))
  })
})
