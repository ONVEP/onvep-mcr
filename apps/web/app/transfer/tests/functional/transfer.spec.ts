import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

import CssVariable from '#graphics/models/css_variable'
import CustomCss from '#graphics/models/custom_css'
import Layer from '#graphics/models/layer'
import { LayerFactory } from '#graphics/database/factories/layers'
import NetworkDrive from '#media/models/network_drive'
import { NetworkDriveFactory } from '#media/database/factories/network_drive'
import Rundown from '#rundowns/models/rundown'
import Step from '#rundowns/models/step'
import StepType from '#rundowns/models/step_type'
import { RundownFactory, StepTypeFactory } from '#rundowns/database/factories/rundowns'
import { UserFactory } from '#users/database/factories/user'
import { ALL_PERMISSIONS, PERMISSIONS } from '#users/enums/permission'
import { ROLES } from '#users/enums/role'
import Role from '#users/models/role'
import { fakeContextEngine, type FakeContextEngine } from '#tests/helpers/context_engine'
import { assertForbiddenRedirect } from '#tests/helpers/http'
import { ensureBaseRoles, withPermissions, withRole } from '#tests/helpers/rbac'
import { BUNDLE_FORMAT, BUNDLE_VERSION, type TransferBundle } from '#transfer/types/bundle'

async function admin() {
  const user = await UserFactory.create()
  await withRole(user, ROLES.ADMIN)
  return user
}

function bundle(content: Partial<TransferBundle>): TransferBundle {
  return { format: BUNDLE_FORMAT, version: BUNDLE_VERSION, exportedAt: '', ...content }
}

function fileOf(content: unknown) {
  return Buffer.from(JSON.stringify(content))
}

test.group('Endpoint /transfer', (group) => {
  let engine: FakeContextEngine

  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())
  group.each.setup(() => ensureBaseRoles())
  group.each.setup(() => {
    const { fake, restore } = fakeContextEngine()
    engine = fake
    return restore
  })

  test('GET sans auth redirige vers login', async ({ client, assert }) => {
    const response = await client.get('/transfer').redirects(0)
    response.assertStatus(302)
    assert.equal(response.header('location'), '/login')
  })

  test('GET sans la permission transfer est refusé', async ({ client }) => {
    const user = await UserFactory.create()
    await withPermissions(user, 'graphics', [PERMISSIONS.graphicsManage])

    const response = await client.get('/transfer').loginAs(user).redirects(0)
    assertForbiddenRedirect(response)
  })

  test("GET n'offre que les nœuds que l'utilisateur gère", async ({ client, assert }) => {
    const user = await UserFactory.create()
    await withPermissions(user, 'transfer-graphics', [
      PERMISSIONS.transferManage,
      PERMISSIONS.graphicsManage,
    ])
    const layer = await LayerFactory.create()

    const response = await client.get('/transfer').loginAs(user).withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('transfer/index')
    assert.deepEqual(response.inertiaProps.nodes, [
      'graphics.layers',
      'graphics.cssVariables',
      'graphics.customCss',
    ])
    assert.deepInclude(response.inertiaProps.inventory.collections['graphics.layers'], {
      key: String(layer.id),
      label: `${layer.name} (${layer.slug})`,
    })
    assert.notProperty(response.inertiaProps.inventory.collections, 'users.roles')
  })

  test('GET signale un moteur de contexte injoignable sans échouer', async ({ client, assert }) => {
    engine.goOffline()

    const response = await client
      .get('/transfer')
      .loginAs(await admin())
      .withInertia()

    response.assertStatus(200)
    assert.isFalse(response.inertiaProps.inventory.engineAvailable)
  })

  test('POST export ne contient que les éléments choisis, mots de passe en clair', async ({
    client,
    assert,
  }) => {
    const kept = await NetworkDriveFactory.merge({ name: 'NAS', password: 'secret' }).create()
    await NetworkDriveFactory.create()
    const rundown = await RundownFactory.with('steps', 2).create()
    engine.mutators = [{ name: 'sync.js', subscriptions: [], source: 'export default 1' }]

    const response = await client
      .post('/transfer/export')
      .loginAs(await admin())
      .withCsrfToken()
      .accept('json')
      .json({
        collections: {
          'media.networkDrives': [String(kept.id)],
          'rundowns.rundowns': [String(rundown.id)],
          'context.mutators': ['sync.js'],
        },
        singletons: [],
      })

    response.assertStatus(200)
    assert.match(response.header('content-disposition') ?? '', /attachment; filename="onvep-mcr-/)
    const body = response.body() as TransferBundle
    assert.equal(body.format, BUNDLE_FORMAT)
    assert.deepEqual(body.media?.networkDrives, [
      { name: 'NAS', url: kept.url, username: kept.username, password: 'secret' },
    ])
    assert.lengthOf(body.rundowns!.rundowns!, 1)
    assert.lengthOf(body.rundowns!.rundowns![0].steps, 2)
    assert.properties(body.rundowns!.rundowns![0].steps[0].stepType, ['name', 'color'])
    assert.notProperty(body.rundowns!, 'stepTypes')
    assert.deepEqual(body.context?.mutators, [{ name: 'sync.js', source: 'export default 1' }])
    assert.notProperty(body, 'graphics')
  })

  test("POST export d'un nœud non géré est refusé", async ({ client }) => {
    const user = await UserFactory.create()
    await withPermissions(user, 'transfer-only', [PERMISSIONS.transferManage])

    const response = await client
      .post('/transfer/export')
      .loginAs(user)
      .withCsrfToken()
      .accept('json')
      .redirects(0)
      .json({ collections: { 'users.roles': [] }, singletons: [] })

    response.assertStatus(403)
  })

  test('POST import crée ce qui manque, avec les types de pas des étapes', async ({
    client,
    assert,
  }) => {
    const file = bundle({
      rundowns: {
        rundowns: [
          {
            name: 'Match',
            startTime: '20:00:00',
            steps: [
              {
                title: 'Intro',
                stepType: { name: 'Import test type', color: '#FF0000' },
                plannedDuration: 30,
                playedTime: null,
                waitUntil: null,
                autoNext: true,
              },
            ],
          },
        ],
      },
      graphics: {
        layers: [{ name: 'Score', slug: 'score', enabled: true, content: '<p>0-0</p>' }],
        cssVariables: [{ name: 'brand', kind: 'color', value: '#123456' }],
        customCss: 'body { color: red }',
      },
      media: {
        networkDrives: [{ name: 'NAS', url: 'smb://nas/media', username: 'u', password: 'p' }],
      },
      context: {
        data: { score: { home: 1 } },
        validators: [{ path: 'score', schema: { type: 'object' } }],
        mutators: [{ name: 'sync.js', source: 'export default 1' }],
      },
    })

    const response = await client
      .post('/transfer/import')
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .field('mode', 'overwrite')
      .field(
        'selection',
        JSON.stringify({
          collections: {
            'rundowns.rundowns': ['0'],
            'graphics.layers': ['0'],
            'graphics.cssVariables': ['0'],
            'media.networkDrives': ['0'],
            'context.validators': ['0'],
            'context.mutators': ['0'],
          },
          singletons: ['graphics.customCss', 'context.data'],
        })
      )
      .file('file', fileOf(file), { filename: 'export.json', contentType: 'application/json' })

    response.assertStatus(302)
    assert.equal(response.header('location'), '/transfer')

    const rundown = await Rundown.query().where('name', 'Match').preload('steps').firstOrFail()
    assert.equal(rundown.startTime, '20:00:00')
    assert.lengthOf(rundown.steps, 1)
    const stepType = await StepType.findByOrFail('name', 'Import test type')
    assert.equal(stepType.color, '#ff0000')
    assert.equal(rundown.steps[0].stepTypeId, stepType.id)

    const layer = await Layer.findByOrFail('slug', 'score')
    assert.equal(layer.content, '<p>0-0</p>')
    const variable = await CssVariable.findByOrFail('name', 'brand')
    assert.equal(variable.value, '#123456')
    const customCss = await CustomCss.query().firstOrFail()
    assert.equal(customCss.content, 'body { color: red }')
    const drive = await NetworkDrive.findByOrFail('name', 'NAS')
    assert.equal(drive.password, 'p')

    assert.deepEqual(engine.callsTo('createValidator'), [
      [{ path: 'score', schema: { type: 'object' } }],
    ])
    assert.deepEqual(engine.callsTo('saveMutator'), [['sync.js', 'export default 1']])
    assert.deepEqual(engine.callsTo('setValue'), [['', { score: { home: 1 } }]])
  })

  test("POST import en mode skip laisse l'existant, overwrite le remplace", async ({
    client,
    assert,
  }) => {
    const user = await admin()
    await LayerFactory.merge({ slug: 'score', content: 'local' }).create()
    const rundown = await RundownFactory.merge({ name: 'Match' }).with('steps', 3).create()
    const file = fileOf(
      bundle({
        graphics: { layers: [{ name: 'Score', slug: 'score', enabled: false, content: 'file' }] },
        rundowns: { rundowns: [{ name: 'Match', startTime: '21:00:00', steps: [] }] },
      })
    )
    const selection = JSON.stringify({
      collections: { 'graphics.layers': ['0'], 'rundowns.rundowns': ['0'] },
      singletons: [],
    })
    const send = (mode: string) =>
      client
        .post('/transfer/import')
        .loginAs(user)
        .withCsrfToken()
        .redirects(0)
        .field('mode', mode)
        .field('selection', selection)
        .file('file', file, { filename: 'export.json', contentType: 'application/json' })

    await send('skip')
    const untouched = await Layer.findByOrFail('slug', 'score')
    assert.equal(untouched.content, 'local')
    assert.lengthOf(await Step.query().where('rundown_id', rundown.id), 3)

    await send('overwrite')
    const layer = await Layer.findByOrFail('slug', 'score')
    assert.equal(layer.content, 'file')
    assert.isFalse(layer.enabled)
    await rundown.refresh()
    assert.equal(rundown.startTime, '21:00:00')
    assert.lengthOf(await Step.query().where('rundown_id', rundown.id), 0)
    assert.lengthOf(await Layer.query().where('slug', 'score'), 1)
  })

  test("POST import n'importe que les éléments choisis du fichier", async ({ client, assert }) => {
    const file = bundle({
      rundowns: {
        stepTypes: [
          { name: 'Pub', color: '#000000' },
          { name: 'Live', color: '#ffffff' },
        ],
      },
    })

    await client
      .post('/transfer/import')
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .field('mode', 'overwrite')
      .field(
        'selection',
        JSON.stringify({ collections: { 'rundowns.stepTypes': ['1'] }, singletons: [] })
      )
      .file('file', fileOf(file), { filename: 'export.json', contentType: 'application/json' })

    assert.isNull(await StepType.findBy('name', 'Pub'))
    assert.isNotNull(await StepType.findBy('name', 'Live'))
  })

  test('POST import ne modifie jamais le rôle admin et ignore les permissions inconnues', async ({
    client,
    assert,
  }) => {
    const file = bundle({
      users: {
        roles: [
          { name: ROLES.ADMIN, permissions: [] },
          { name: 'regie', permissions: [PERMISSIONS.liveView, 'removed.permission'] },
        ],
      },
    })

    await client
      .post('/transfer/import')
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .field('mode', 'overwrite')
      .field(
        'selection',
        JSON.stringify({ collections: { 'users.roles': ['0', '1'] }, singletons: [] })
      )
      .file('file', fileOf(file), { filename: 'export.json', contentType: 'application/json' })

    const adminRole = await Role.findByOrFail('name', ROLES.ADMIN)
    assert.sameMembers(adminRole.permissions, ALL_PERMISSIONS)
    const imported = await Role.findByOrFail('name', 'regie')
    assert.deepEqual(imported.permissions, [PERMISSIONS.liveView])
  })

  test("POST import d'un fichier qui n'est pas un export est refusé", async ({
    client,
    assert,
  }) => {
    await StepTypeFactory.create()
    const existing = await StepType.all()

    const response = await client
      .post('/transfer/import')
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .field('mode', 'overwrite')
      .field('selection', JSON.stringify({ collections: {}, singletons: [] }))
      .file('file', fileOf({ hello: 'world' }), {
        filename: 'export.json',
        contentType: 'application/json',
      })

    response.assertStatus(302)
    assert.lengthOf(await StepType.all(), existing.length)
  })

  test("POST import d'un nœud non géré est refusé", async ({ client, assert }) => {
    const user = await UserFactory.create()
    await withPermissions(user, 'transfer-only', [PERMISSIONS.transferManage])

    const response = await client
      .post('/transfer/import')
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)
      .field('mode', 'overwrite')
      .field('selection', JSON.stringify({ collections: { 'users.roles': ['0'] }, singletons: [] }))
      .file('file', fileOf(bundle({ users: { roles: [{ name: 'x-role', permissions: [] }] } })), {
        filename: 'export.json',
        contentType: 'application/json',
      })

    assertForbiddenRedirect(response)
    assert.isNull(await Role.findBy('name', 'x-role'))
  })

  test('un export réimporté recrée les mêmes données', async ({ client, assert }) => {
    const user = await admin()
    const rundown = await RundownFactory.merge({ name: 'Aller-retour' }).with('steps', 2).create()

    const exported = await client
      .post('/transfer/export')
      .loginAs(user)
      .withCsrfToken()
      .accept('json')
      .json({ collections: { 'rundowns.rundowns': [String(rundown.id)] }, singletons: [] })

    await Step.query().where('rundown_id', rundown.id).delete()
    await rundown.delete()

    await client
      .post('/transfer/import')
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)
      .field('mode', 'overwrite')
      .field(
        'selection',
        JSON.stringify({ collections: { 'rundowns.rundowns': ['0'] }, singletons: [] })
      )
      .file('file', fileOf(exported.body()), {
        filename: 'export.json',
        contentType: 'application/json',
      })

    const restored = await Rundown.query()
      .where('name', 'Aller-retour')
      .preload('steps')
      .firstOrFail()
    assert.lengthOf(restored.steps, 2)
  })
})
