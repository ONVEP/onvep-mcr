import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

import { ROLES } from '#users/enums/role'
import { PERMISSIONS } from '#users/enums/permission'
import { UserFactory } from '#users/database/factories/user'
import { RundownFactory, StepTypeFactory } from '#rundowns/database/factories/rundowns'
import StepType from '#rundowns/models/step_type'
import { assertForbiddenRedirect } from '#tests/helpers/http'
import { ensureBaseRoles, withPermissions, withRole } from '#tests/helpers/rbac'

async function admin() {
  const user = await UserFactory.create()
  await withRole(user, ROLES.ADMIN)
  return user
}

test.group('Endpoint /rundowns/step-types', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())
  group.each.setup(() => ensureBaseRoles())

  test('GET sans auth redirige vers login', async ({ client, assert }) => {
    const response = await client.get('/rundowns/step-types').redirects(0)
    response.assertStatus(302)
    assert.equal(response.header('location'), '/login')
  })

  test('GET avec rundowns.manage seul est refusé', async ({ client }) => {
    const user = await UserFactory.create()
    await withPermissions(user, 'editor', [PERMISSIONS.rundownsManage])

    const response = await client.get('/rundowns/step-types').loginAs(user).redirects(0)
    assertForbiddenRedirect(response)
  })

  test('GET en admin liste les types', async ({ client, assert }) => {
    await StepTypeFactory.merge({ name: 'Spec type', color: '#f59e0b' }).create()

    const response = await client
      .get('/rundowns/step-types')
      .loginAs(await admin())
      .withInertia()
    response.assertStatus(200)
    response.assertInertiaComponent('rundowns/step_types/index')
    assert.deepInclude(
      response.inertiaProps.stepTypes.map((s: { name: string; color: string }) => ({
        name: s.name,
        color: s.color,
      })),
      { name: 'Spec type', color: '#f59e0b' }
    )
  })

  test('POST crée un type avec la couleur en minuscules', async ({ client, assert }) => {
    const response = await client
      .post('/rundowns/step-types')
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .json({ name: 'Météo', color: '#ABCDEF' })

    response.assertStatus(302)
    const type = await StepType.findByOrFail('name', 'Météo')
    assert.equal(type.color, '#abcdef')
  })

  test('POST avec une couleur invalide retourne 422', async ({ client }) => {
    const response = await client
      .post('/rundowns/step-types')
      .loginAs(await admin())
      .withCsrfToken()
      .accept('json')
      .redirects(0)
      .json({ name: 'Météo', color: 'red' })

    response.assertStatus(422)
  })

  test('POST avec un nom déjà pris retourne 422', async ({ client }) => {
    await StepTypeFactory.merge({ name: 'Spec type' }).create()

    const response = await client
      .post('/rundowns/step-types')
      .loginAs(await admin())
      .withCsrfToken()
      .accept('json')
      .redirects(0)
      .json({ name: 'Spec type', color: '#000000' })

    response.assertStatus(422)
  })

  test('PUT modifie le type en gardant son propre nom', async ({ client, assert }) => {
    const type = await StepTypeFactory.merge({ name: 'Spec type' }).create()

    const response = await client
      .put(`/rundowns/step-types/${type.id}`)
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .json({ name: 'Spec type', color: '#112233' })

    response.assertStatus(302)
    await type.refresh()
    assert.equal(type.color, '#112233')
  })

  test('DELETE supprime un type inutilisé', async ({ client, assert }) => {
    const type = await StepTypeFactory.create()

    const response = await client
      .delete(`/rundowns/step-types/${type.id}`)
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
    assert.isNull(await StepType.find(type.id))
  })

  test('DELETE refuse un type utilisé par une step', async ({ client, assert }) => {
    const type = await StepTypeFactory.create()
    await RundownFactory.with('steps', 1, (step) => step.merge({ stepTypeId: type.id })).create()

    const response = await client
      .delete(`/rundowns/step-types/${type.id}`)
      .loginAs(await admin())
      .withCsrfToken()
      .accept('json')
      .redirects(0)

    response.assertStatus(409)
    assert.isNotNull(await StepType.find(type.id))
  })
})
