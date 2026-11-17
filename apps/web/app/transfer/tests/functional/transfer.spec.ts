import driveService from '@adonisjs/drive/services/main'
import testUtils from '@adonisjs/core/services/test_utils'
import type { ApiRequest } from '@japa/api-client'
import { test } from '@japa/runner'
import tar from 'tar-stream'

import env from '#start/env'
import Asset from '#graphics/models/asset'
import { AssetFactory } from '#graphics/database/factories/assets'
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

async function collect(source: AsyncIterable<unknown>) {
  const chunks: Buffer[] = []
  for await (const chunk of source) chunks.push(chunk as Buffer)
  return Buffer.concat(chunks)
}

/** An export archive: the manifest, then `assets/<name>` files. */
async function fileOf(manifest: unknown, assets: Record<string, string> = {}) {
  const pack = tar.pack()
  pack.entry({ name: 'bundle.json' }, JSON.stringify(manifest))
  for (const [name, content] of Object.entries(assets)) {
    pack.entry({ name: `assets/${name}` }, content)
  }
  pack.finalize()
  return collect(pack)
}

async function unpack(archive: Buffer) {
  const extract = tar.extract()
  extract.end(archive)
  const entries: Record<string, string> = {}
  for await (const entry of extract) {
    const content = await collect(entry)
    entries[entry.header.name] = content.toString('utf8')
  }
  const { 'bundle.json': manifest, ...files } = entries
  return { manifest: JSON.parse(manifest) as TransferBundle, files }
}

/** Sends an export form and buffers the archive it downloads. */
function exportArchive(request: ApiRequest, selection: object) {
  request
    .withCsrfToken()
    .form({ selection: JSON.stringify(selection) })
    .request.buffer(true)
    // Typed as the browser response; on node it is the IncomingMessage stream.
    .parse((res, callback) => {
      collect(res as unknown as AsyncIterable<Buffer>).then(
        (body) => callback(null, body),
        (error) => callback(error, null)
      )
    })
  return request
}

const TAR = { filename: 'export.tar', contentType: 'application/x-tar' }

test.group('Endpoint /transfer', (group) => {
  let engine: FakeContextEngine

  const diskName = env.get('DRIVE_DISK') || 'fs'

  group.each.setup(() => {
    driveService.fake(diskName)
    return () => driveService.restore(diskName)
  })
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
      'graphics.assets',
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
    engine.mutators = [
      { name: 'sync.js', subscriptions: [], enabled: false, source: 'export default 1' },
    ]

    const response = await exportArchive(client.post('/transfer/export').loginAs(await admin()), {
      collections: {
        'media.networkDrives': [String(kept.id)],
        'rundowns.rundowns': [String(rundown.id)],
        'context.mutators': ['sync.js'],
      },
      singletons: [],
    })

    response.assertStatus(200)
    assert.match(
      response.header('content-disposition') ?? '',
      /attachment; filename="onvep-mcr-.*\.tar"/
    )
    const { manifest: body, files } = await unpack(response.body())
    assert.deepEqual(files, {})
    assert.equal(body.format, BUNDLE_FORMAT)
    assert.deepEqual(body.media?.networkDrives, [
      { name: 'NAS', url: kept.url, username: kept.username, password: 'secret' },
    ])
    assert.lengthOf(body.rundowns!.rundowns!, 1)
    assert.lengthOf(body.rundowns!.rundowns![0].steps, 2)
    assert.properties(body.rundowns!.rundowns![0].steps[0].stepType, ['name', 'color'])
    assert.notProperty(body.rundowns!, 'stepTypes')
    assert.deepEqual(body.context?.mutators, [
      { name: 'sync.js', source: 'export default 1', enabled: false },
    ])
    assert.notProperty(body, 'graphics')
  })

  test("POST export d'un nœud non géré est refusé", async ({ client }) => {
    const user = await UserFactory.create()
    await withPermissions(user, 'transfer-only', [PERMISSIONS.transferManage])

    const response = await client
      .post('/transfer/export')
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)
      .form({ selection: JSON.stringify({ collections: { 'users.roles': [] }, singletons: [] }) })

    assertForbiddenRedirect(response)
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
        mutators: [{ name: 'sync.js', source: 'export default 1', enabled: false }],
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
      .file('file', await fileOf(file), TAR)

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
      [{ path: 'score', schema: { type: 'object' }, enabled: true }],
    ])
    assert.deepEqual(engine.callsTo('saveMutator'), [['sync.js', 'export default 1']])
    assert.deepEqual(engine.callsTo('setMutatorEnabled'), [['sync.js', false]])
    assert.deepEqual(engine.callsTo('setValue'), [['', { score: { home: 1 } }]])
  })

  test("POST import en mode skip laisse l'existant, overwrite le remplace", async ({
    client,
    assert,
  }) => {
    const user = await admin()
    await LayerFactory.merge({ slug: 'score', content: 'local' }).create()
    const rundown = await RundownFactory.merge({ name: 'Match' }).with('steps', 3).create()
    const file = await fileOf(
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
        .file('file', file, TAR)

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
      .file('file', await fileOf(file), TAR)

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
      .file('file', await fileOf(file), TAR)

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
      .file('file', await fileOf({ hello: 'world' }), TAR)

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
      .file(
        'file',
        await fileOf(bundle({ users: { roles: [{ name: 'x-role', permissions: [] }] } })),
        TAR
      )

    assertForbiddenRedirect(response)
    assert.isNull(await Role.findBy('name', 'x-role'))
  })

  test('un export réimporté recrée les mêmes données', async ({ client, assert }) => {
    const user = await admin()
    const rundown = await RundownFactory.merge({ name: 'Aller-retour' }).with('steps', 2).create()

    const exported = await exportArchive(client.post('/transfer/export').loginAs(user), {
      collections: { 'rundowns.rundowns': [String(rundown.id)] },
      singletons: [],
    })

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
      .file('file', exported.body(), TAR)

    const restored = await Rundown.query()
      .where('name', 'Aller-retour')
      .preload('steps')
      .firstOrFail()
    assert.lengthOf(restored.steps, 2)
  })

  test("un export d'assets les embarque et les restaure à l'import", async ({ client, assert }) => {
    const user = await admin()
    const asset = await AssetFactory.merge({ name: 'logo.svg' }).create()

    const exported = await exportArchive(client.post('/transfer/export').loginAs(user), {
      collections: { 'graphics.assets': [String(asset.id)] },
      singletons: [],
    })
    const { manifest, files } = await unpack(exported.body())
    assert.deepEqual(manifest.graphics?.assets, [{ name: 'logo.svg' }])
    assert.deepEqual(files, { 'assets/logo.svg': 'hello' })

    await asset.delete()

    const response = await client
      .post('/transfer/import')
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)
      .field('mode', 'overwrite')
      .field(
        'selection',
        JSON.stringify({ collections: { 'graphics.assets': ['0'] }, singletons: [] })
      )
      .file('file', exported.body(), TAR)

    response.assertStatus(302)
    assert.equal(response.header('location'), '/transfer')
    const restored = await Asset.findByOrFail('name', 'logo.svg')
    const restoredContent = await restored.file.getBuffer()
    assert.equal(restoredContent.toString('utf8'), 'hello')
  })

  test("POST import d'assets : skip garde le fichier local, overwrite le remplace", async ({
    client,
    assert,
  }) => {
    const user = await admin()
    await AssetFactory.merge({ name: 'fond.svg' }).create()
    const file = await fileOf(bundle({ graphics: { assets: [{ name: 'fond.svg' }] } }), {
      'fond.svg': 'from archive',
    })
    const send = (mode: string) =>
      client
        .post('/transfer/import')
        .loginAs(user)
        .withCsrfToken()
        .redirects(0)
        .field('mode', mode)
        .field(
          'selection',
          JSON.stringify({ collections: { 'graphics.assets': ['0'] }, singletons: [] })
        )
        .file('file', file, TAR)

    const content = async () => {
      const asset = await Asset.findByOrFail('name', 'fond.svg')
      const buffer = await asset.file.getBuffer()
      return buffer.toString('utf8')
    }

    await send('skip')
    assert.equal(await content(), 'hello')

    await send('overwrite')
    assert.equal(await content(), 'from archive')
    assert.lengthOf(await Asset.query().where('name', 'fond.svg'), 1)
  })

  test("POST import refuse un nom d'asset qui n'a pas la forme d'une URL", async ({
    client,
    assert,
  }) => {
    const response = await client
      .post('/transfer/import')
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .field('mode', 'overwrite')
      .field(
        'selection',
        JSON.stringify({ collections: { 'graphics.assets': ['0'] }, singletons: [] })
      )
      .file(
        'file',
        await fileOf(bundle({ graphics: { assets: [{ name: '../../evil.sh' }] } }), {
          '../../evil.sh': 'x',
        }),
        TAR
      )

    response.assertStatus(302)
    assert.isNull(await Asset.findBy('name', '../../evil.sh'))
  })
})
