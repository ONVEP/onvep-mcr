import drive from '@adonisjs/drive/services/main'
import testUtils from '@adonisjs/core/services/test_utils'
import fileGenerator from '@poppinss/file-generator'
import { test } from '@japa/runner'

import env from '#start/env'
import { ROLES } from '#users/enums/role'
import { UserFactory } from '#users/database/factories/user'
import { AssetFactory } from '#graphics/database/factories/assets'
import Asset from '#graphics/models/asset'
import { assertForbiddenRedirect } from '#tests/helpers/http'
import { ensureBaseRoles, withRole } from '#tests/helpers/rbac'

async function admin() {
  const user = await UserFactory.create()
  await withRole(user, ROLES.ADMIN)
  return user
}

test.group('Endpoint /graphics/assets', (group) => {
  const diskName = env.get('DRIVE_DISK') || 'fs'

  group.each.setup(() => {
    drive.fake(diskName)
    return () => drive.restore(diskName)
  })
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())
  group.each.setup(() => ensureBaseRoles())

  test('GET sans permission est refusé', async ({ client }) => {
    const user = await UserFactory.create()
    await withRole(user, ROLES.USER)

    const response = await client.get('/graphics/assets').loginAs(user).redirects(0)
    assertForbiddenRedirect(response)
  })

  test('GET liste les assets avec leur URL publique', async ({ client, assert }) => {
    await Asset.query().delete()
    await AssetFactory.merge({ name: 'logo.png' }).create()

    const response = await client
      .get('/graphics/assets')
      .loginAs(await admin())
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('graphics/assets')
    assert.deepEqual(
      response.inertiaProps.assets.map((a: { url: string }) => a.url),
      ['/cg/files/logo.png']
    )
  })

  test('POST importe un fichier sous un nom unique', async ({ client, assert }) => {
    await Asset.query().delete()
    await AssetFactory.merge({ name: 'mon-logo.png' }).create()
    const png = await fileGenerator.generatePng(10 * 1024, 'Mon Logo.PNG')

    const response = await client
      .post('/graphics/assets')
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .file('file', png.contents, { filename: png.name, contentType: png.mime })

    response.assertStatus(302)
    assert.equal(response.header('location'), '/graphics/assets')
    const created = await Asset.query().orderBy('id', 'desc').firstOrFail()
    assert.equal(created.name, 'mon-logo-2.png')
  })

  test('POST accepte un fichier au-delà de la limite globale du bodyparser', async ({
    client,
    assert,
  }) => {
    await Asset.query().delete()

    const response = await client
      .post('/graphics/assets')
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .file('file', Buffer.alloc(25 * 1024 * 1024), {
        filename: 'clip.mp4',
        contentType: 'video/mp4',
      })

    response.assertStatus(302)
    assert.equal(response.header('location'), '/graphics/assets')
    const created = await Asset.findByOrFail('name', 'clip.mp4')
    assert.equal(created.file.size, 25 * 1024 * 1024)
  })

  test('POST refuse une extension non autorisée', async ({ client, assert }) => {
    await Asset.query().delete()

    const response = await client
      .post('/graphics/assets')
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .file('file', Buffer.from('echo'), { filename: 'run.sh', contentType: 'text/x-sh' })

    response.assertStatus(302)
    assert.lengthOf(await Asset.all(), 0)
  })

  test('PUT remplace le fichier en gardant le nom', async ({ client, assert }) => {
    const asset = await AssetFactory.merge({ name: 'fond.png' }).create()
    const png = await fileGenerator.generatePng(10 * 1024, 'autre.png')

    const response = await client
      .put(`/graphics/assets/${asset.id}`)
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .file('file', png.contents, { filename: png.name, contentType: png.mime })

    response.assertStatus(302)
    await asset.refresh()
    assert.equal(asset.name, 'fond.png')
    assert.equal(asset.file.mimeType, 'image/png')
  })

  test('DELETE supprime un asset', async ({ client, assert }) => {
    const asset = await AssetFactory.create()

    const response = await client
      .delete(`/graphics/assets/${asset.id}`)
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
    assert.isNull(await Asset.find(asset.id))
  })

  test('GET /cg/files/:name sert le fichier sans authentification', async ({ client }) => {
    const asset = await AssetFactory.create()

    const response = await client.get(`/cg/files/${asset.name}`)

    response.assertStatus(200)
    response.assertHeader('access-control-allow-origin', '*')
    response.assertTextIncludes('hello')
  })

  test('GET /cg/files/:name inconnu renvoie 404', async ({ client }) => {
    const response = await client.get('/cg/files/inconnu.png')
    response.assertStatus(404)
  })
})
