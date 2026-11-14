import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'

import { ROLES } from '#users/enums/role'
import { UserFactory } from '#users/database/factories/user'
import { NetworkDriveFactory } from '#media/database/factories/network_drive'
import NetworkDrive from '#media/models/network_drive'
import { assertForbiddenRedirect } from '#tests/helpers/http'
import { ensureBaseRoles, withRole } from '#tests/helpers/rbac'

async function admin() {
  const user = await UserFactory.create()
  await withRole(user, ROLES.ADMIN)
  return user
}

test.group('Endpoint /media/network-drives', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())
  group.each.setup(() => ensureBaseRoles())

  test('GET sans auth redirige vers login', async ({ client, assert }) => {
    const response = await client.get('/media/network-drives').redirects(0)
    response.assertStatus(302)
    assert.equal(response.header('location'), '/login')
  })

  test('GET en user simple est refusé', async ({ client }) => {
    const user = await UserFactory.create()
    await withRole(user, ROLES.USER)

    const response = await client.get('/media/network-drives').loginAs(user).redirects(0)
    assertForbiddenRedirect(response)
  })

  test('GET en admin rend la liste sans exposer le mot de passe', async ({ client, assert }) => {
    await NetworkDriveFactory.merge({ name: 'NAS', password: 'secret' }).create()

    const response = await client
      .get('/media/network-drives')
      .loginAs(await admin())
      .withInertia()
    response.assertStatus(200)
    response.assertInertiaComponent('media/network_drives/index')
    const row = response.inertiaProps.networkDrives.data[0]
    assert.equal(row.name, 'NAS')
    assert.notProperty(row, 'password')
  })

  test('GET /edit en admin rend la modale sans le mot de passe', async ({ client, assert }) => {
    const drive = await NetworkDriveFactory.create()

    const response = await client
      .get(`/media/network-drives/${drive.id}/edit`)
      .loginAs(await admin())
      .withInertia()
    response.assertStatus(200)
    assert.equal(response.inertiaProps.modal.component, 'media/network_drives/edit')
    assert.equal(response.inertiaProps.modal.props.networkDrive.id, drive.id)
    assert.notProperty(response.inertiaProps.modal.props.networkDrive, 'password')
  })

  test('POST crée le lecteur et chiffre le mot de passe', async ({ client, assert }) => {
    const response = await client
      .post('/media/network-drives')
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .json({
        name: 'NAS',
        url: 'smb://nas.network/Storage',
        username: 'media',
        password: 'secret',
      })

    response.assertStatus(302)
    assert.equal(response.header('location'), '/media/network-drives')

    const raw = await db.from('network_drives').where('name', 'NAS').firstOrFail()
    assert.notEqual(raw.password, 'secret')

    const drive = await NetworkDrive.findByOrFail('name', 'NAS')
    assert.equal(drive.password, 'secret')
    assert.equal(drive.url, 'smb://nas.network/Storage')
  })

  test('POST en user simple est refusé', async ({ client, assert }) => {
    const user = await UserFactory.create()
    await withRole(user, ROLES.USER)

    const response = await client
      .post('/media/network-drives')
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)
      .json({ name: 'NAS', url: 'smb://nas.network/Storage', username: 'u', password: 'p' })

    assertForbiddenRedirect(response)
    assert.isNull(await NetworkDrive.findBy('name', 'NAS'))
  })

  test('POST avec une url invalide retourne 422', async ({ client }) => {
    const response = await client
      .post('/media/network-drives')
      .loginAs(await admin())
      .withCsrfToken()
      .accept('json')
      .redirects(0)
      .json({ name: 'NAS', url: 'https://example.com', username: 'u', password: 'p' })

    response.assertStatus(422)
  })

  test('POST avec un nom déjà pris retourne 422', async ({ client }) => {
    await NetworkDriveFactory.merge({ name: 'NAS' }).create()

    const response = await client
      .post('/media/network-drives')
      .loginAs(await admin())
      .withCsrfToken()
      .accept('json')
      .redirects(0)
      .json({ name: 'NAS', url: 'smb://nas/Storage', username: 'u', password: 'p' })

    response.assertStatus(422)
  })

  test('PUT sans mot de passe conserve le mot de passe existant', async ({ client, assert }) => {
    const drive = await NetworkDriveFactory.merge({ password: 'secret' }).create()

    const response = await client
      .put(`/media/network-drives/${drive.id}`)
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .json({ name: drive.name, url: 'smb://other.nas/Media', username: 'new-user' })

    response.assertStatus(302)
    await drive.refresh()
    assert.equal(drive.url, 'smb://other.nas/Media')
    assert.equal(drive.username, 'new-user')
    assert.equal(drive.password, 'secret')
  })

  test('PUT avec mot de passe le remplace', async ({ client, assert }) => {
    const drive = await NetworkDriveFactory.merge({ password: 'secret' }).create()

    await client
      .put(`/media/network-drives/${drive.id}`)
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .json({ name: drive.name, url: drive.url, username: drive.username, password: 'changed' })

    await drive.refresh()
    assert.equal(drive.password, 'changed')
  })

  test('DELETE supprime le lecteur', async ({ client, assert }) => {
    const drive = await NetworkDriveFactory.create()

    const response = await client
      .delete(`/media/network-drives/${drive.id}`)
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
    assert.isNull(await NetworkDrive.find(drive.id))
  })
})
