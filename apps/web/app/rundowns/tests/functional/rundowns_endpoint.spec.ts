import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

import { ROLES } from '#users/enums/role'
import { UserFactory } from '#users/database/factories/user'
import { RundownFactory, StepTypeFactory } from '#rundowns/database/factories/rundowns'
import Rundown from '#rundowns/models/rundown'
import Step from '#rundowns/models/step'
import { assertForbiddenRedirect } from '#tests/helpers/http'
import { ensureBaseRoles, withRole } from '#tests/helpers/rbac'

async function admin() {
  const user = await UserFactory.create()
  await withRole(user, ROLES.ADMIN)
  return user
}

async function plainUser() {
  const user = await UserFactory.create()
  await withRole(user, ROLES.USER)
  return user
}

test.group('Endpoint /live', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())
  group.each.setup(() => ensureBaseRoles())

  test('GET sans auth redirige vers login', async ({ client, assert }) => {
    const response = await client.get('/live').redirects(0)
    response.assertStatus(302)
    assert.equal(response.header('location'), '/login')
  })

  test('GET sans permission est refusé', async ({ client }) => {
    const response = await client
      .get('/live')
      .loginAs(await plainUser())
      .redirects(0)
    assertForbiddenRedirect(response)
  })

  test('GET avec permission rend la page', async ({ client }) => {
    const response = await client
      .get('/live')
      .loginAs(await admin())
      .withInertia()
    response.assertStatus(200)
    response.assertInertiaComponent('rundowns/live')
  })
})

test.group('Endpoint /preparation', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())
  group.each.setup(() => ensureBaseRoles())

  test('GET sans auth redirige vers login', async ({ client, assert }) => {
    const response = await client.get('/preparation').redirects(0)
    response.assertStatus(302)
    assert.equal(response.header('location'), '/login')
  })

  test('GET sans permission est refusé', async ({ client }) => {
    const response = await client
      .get('/preparation')
      .loginAs(await plainUser())
      .redirects(0)
    assertForbiddenRedirect(response)
  })

  test('GET liste les rundowns avec leur nombre de steps', async ({ client, assert }) => {
    const rundown = await RundownFactory.merge({ name: 'Matinale' }).with('steps', 2).create()

    const response = await client
      .get('/preparation')
      .loginAs(await admin())
      .withInertia()
    response.assertStatus(200)
    response.assertInertiaComponent('rundowns/index')
    const row = response.inertiaProps.rundowns.find((r: { id: number }) => r.id === rundown.id)
    assert.equal(row.stepsCount, 2)
  })

  test('POST crée un rundown avec 00:00:00 par défaut', async ({ client, assert }) => {
    const response = await client
      .post('/preparation')
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .json({ name: 'Journal' })

    response.assertStatus(302)
    const rundown = await Rundown.findByOrFail('name', 'Journal')
    assert.equal(rundown.startTime, '00:00:00')
    assert.equal(response.header('location'), `/preparation/${rundown.id}`)
  })

  test('POST normalise HH:MM en HH:MM:SS', async ({ client, assert }) => {
    await client
      .post('/preparation')
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .json({ name: 'Journal', startTime: '18:30' })

    const rundown = await Rundown.findByOrFail('name', 'Journal')
    assert.equal(rundown.startTime, '18:30:00')
  })

  test('POST avec une heure invalide retourne 422', async ({ client }) => {
    const response = await client
      .post('/preparation')
      .loginAs(await admin())
      .withCsrfToken()
      .accept('json')
      .redirects(0)
      .json({ name: 'Journal', startTime: '25:00:00' })

    response.assertStatus(422)
  })

  test('PUT modifie le rundown', async ({ client, assert }) => {
    const rundown = await RundownFactory.create()

    await client
      .put(`/preparation/${rundown.id}`)
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .json({ name: 'Renommé', startTime: '07:00:00' })

    await rundown.refresh()
    assert.equal(rundown.name, 'Renommé')
    assert.equal(rundown.startTime, '07:00:00')
  })

  test('DELETE supprime le rundown et ses steps', async ({ client, assert }) => {
    const rundown = await RundownFactory.with('steps', 2).create()

    const response = await client
      .delete(`/preparation/${rundown.id}`)
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
    assert.isNull(await Rundown.find(rundown.id))
    assert.lengthOf(await Step.query().where('rundown_id', rundown.id), 0)
  })

  test('GET show renvoie les steps ordonnées avec planned_play_time', async ({
    client,
    assert,
  }) => {
    const type = await StepTypeFactory.create()
    const rundown = await RundownFactory.merge({ startTime: '20:00:00' }).create()
    await Step.createMany([
      { rundownId: rundown.id, stepTypeId: type.id, order: 2, title: 'B', plannedDuration: 30 },
      {
        rundownId: rundown.id,
        stepTypeId: type.id,
        order: 1,
        title: 'A',
        plannedDuration: 60,
        playedTime: '20:00:10',
      },
      { rundownId: rundown.id, stepTypeId: type.id, order: 3, title: 'C', plannedDuration: 10 },
    ])

    const response = await client
      .get(`/preparation/${rundown.id}`)
      .loginAs(await admin())
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('rundowns/show')
    const steps = response.inertiaProps.steps as {
      title: string
      plannedPlayTime: string
      stepType: { color: string }
    }[]
    assert.deepEqual(
      steps.map((s) => [s.title, s.plannedPlayTime]),
      [
        ['A', '20:00:10'],
        ['B', '20:01:10'],
        ['C', '20:01:40'],
      ]
    )
    assert.equal(steps[0].stepType.color, type.color)
  })
})

test.group('Endpoint /preparation/:rundown_id/steps', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())
  group.each.setup(() => ensureBaseRoles())

  test('POST ajoute une step en fin de rundown', async ({ client, assert }) => {
    const rundown = await RundownFactory.with('steps', 1, (s) => s.merge({ order: 5 })).create()
    const type = await StepTypeFactory.create()

    const response = await client
      .post(`/preparation/${rundown.id}/steps`)
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .json({ title: 'Nouvelle', stepTypeId: type.id, plannedDuration: 120, autoNext: true })

    response.assertStatus(302)
    const step = await Step.query()
      .where('rundown_id', rundown.id)
      .where('title', 'Nouvelle')
      .firstOrFail()
    assert.equal(step.order, 6)
    assert.equal(step.plannedDuration, 120)
    assert.isNull(step.playedTime)
    assert.isTrue(step.autoNext)
  })

  test('POST avec un type inexistant retourne 422', async ({ client }) => {
    const rundown = await RundownFactory.create()

    const response = await client
      .post(`/preparation/${rundown.id}/steps`)
      .loginAs(await admin())
      .withCsrfToken()
      .accept('json')
      .redirects(0)
      .json({ title: 'X', stepTypeId: 999999, plannedDuration: 10, autoNext: false })

    response.assertStatus(422)
  })

  test('POST sans permission est refusé', async ({ client }) => {
    const rundown = await RundownFactory.create()
    const type = await StepTypeFactory.create()

    const response = await client
      .post(`/preparation/${rundown.id}/steps`)
      .loginAs(await plainUser())
      .withCsrfToken()
      .redirects(0)
      .json({ title: 'X', stepTypeId: type.id, plannedDuration: 10, autoNext: false })

    assertForbiddenRedirect(response)
  })

  test('PUT modifie la step et accepte un played_time', async ({ client, assert }) => {
    const rundown = await RundownFactory.with('steps', 1).create()
    const step = rundown.steps[0]

    await client
      .put(`/preparation/${rundown.id}/steps/${step.id}`)
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .json({
        title: 'Modifiée',
        stepTypeId: step.stepTypeId,
        plannedDuration: 45,
        playedTime: '12:00:05',
        autoNext: false,
      })

    await step.refresh()
    assert.equal(step.title, 'Modifiée')
    assert.equal(step.playedTime, '12:00:05')
  })

  test('PUT accepte un wait_until au format HH:MM et le normalise', async ({ client, assert }) => {
    const rundown = await RundownFactory.with('steps', 1).create()
    const step = rundown.steps[0]

    const response = await client
      .put(`/preparation/${rundown.id}/steps/${step.id}`)
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .json({
        title: step.title,
        stepTypeId: step.stepTypeId,
        plannedDuration: step.plannedDuration,
        waitUntil: '21:30',
        autoNext: false,
      })

    response.assertStatus(302)
    await step.refresh()
    assert.equal(step.waitUntil, '21:30:00')
  })

  test("PUT d'une step d'un autre rundown retourne 404", async ({ client }) => {
    const rundown = await RundownFactory.create()
    const other = await RundownFactory.with('steps', 1).create()

    const response = await client
      .put(`/preparation/${rundown.id}/steps/${other.steps[0].id}`)
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .json({
        title: 'X',
        stepTypeId: other.steps[0].stepTypeId,
        plannedDuration: 1,
        autoNext: false,
      })

    response.assertStatus(404)
  })

  test('POST move échange la step avec sa voisine', async ({ client, assert }) => {
    const rundown = await RundownFactory.with('steps', 2, (s) =>
      s.merge([{ order: 1 }, { order: 2 }])
    ).create()
    const [first, second] = rundown.steps

    await client
      .post(`/preparation/${rundown.id}/steps/${second.id}/move`)
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .json({ direction: 'up' })

    await first.refresh()
    await second.refresh()
    assert.equal(second.order, 1)
    assert.equal(first.order, 2)
  })

  test('DELETE supprime la step', async ({ client, assert }) => {
    const rundown = await RundownFactory.with('steps', 1).create()

    const response = await client
      .delete(`/preparation/${rundown.id}/steps/${rundown.steps[0].id}`)
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
    assert.isNull(await Step.find(rundown.steps[0].id))
  })
})
