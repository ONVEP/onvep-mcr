import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

import { PERMISSIONS } from '#users/enums/permission'
import { ROLES } from '#users/enums/role'
import Role from '#users/models/role'
import User from '#users/models/user'
import { UserFactory } from '#users/database/factories/user'
import { assertForbiddenRedirect } from '#tests/helpers/http'
import { ensureBaseRoles, withRole } from '#tests/helpers/rbac'

async function admin() {
  const user = await UserFactory.create()
  await withRole(user, ROLES.ADMIN)
  return user
}

test.group('Endpoint /roles', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())
  group.each.setup(() => ensureBaseRoles())

  test('GET sem auth redireciona para login', async ({ client, assert }) => {
    const response = await client.get('/roles').redirects(0)
    response.assertStatus(302)
    assert.equal(response.header('location'), '/login')
  })

  test('GET como user comum eh barrado', async ({ client }) => {
    const user = await UserFactory.create()
    await withRole(user, ROLES.USER)

    const response = await client.get('/roles').loginAs(user).redirects(0)
    assertForbiddenRedirect(response)
  })

  test('GET como admin lista roles com contagem de usuarios', async ({ client, assert }) => {
    const editor = await Role.create({ name: 'editor', permissions: [] })
    const member = await UserFactory.create()
    await member.assignRole(editor)

    const response = await client
      .get('/roles')
      .loginAs(await admin())
      .withInertia()
    response.assertStatus(200)
    response.assertInertiaComponent('users/roles/index')

    const rows: { name: string; isSystem: boolean; usersCount: number }[] =
      response.inertiaProps.roles
    assert.isTrue(rows.find((r) => r.name === ROLES.ADMIN)!.isSystem)
    const editorRow = rows.find((r) => r.name === 'editor')!
    assert.isFalse(editorRow.isSystem)
    assert.equal(editorRow.usersCount, 1)
  })

  test('POST cria role customizado', async ({ client, assert }) => {
    const response = await client
      .post('/roles')
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .json({ name: 'editor', permissions: [PERMISSIONS.usersViewList] })

    response.assertStatus(302)
    assert.equal(response.header('location'), '/roles')
    const role = await Role.findByOrFail('name', 'editor')
    assert.deepEqual(role.permissions, [PERMISSIONS.usersViewList])
  })

  test('POST com permissao desconhecida retorna 422', async ({ client }) => {
    const response = await client
      .post('/roles')
      .loginAs(await admin())
      .withCsrfToken()
      .accept('json')
      .redirects(0)
      .json({ name: 'editor', permissions: ['nope.nope'] })

    response.assertStatus(422)
  })

  test('POST com nome duplicado retorna 422', async ({ client }) => {
    const response = await client
      .post('/roles')
      .loginAs(await admin())
      .withCsrfToken()
      .accept('json')
      .redirects(0)
      .json({ name: ROLES.USER, permissions: [] })

    response.assertStatus(422)
  })

  test('PUT no role admin eh barrado', async ({ client, assert }) => {
    const adminRole = await Role.findByOrFail('name', ROLES.ADMIN)

    const response = await client
      .put(`/roles/${adminRole.id}`)
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .json({ name: ROLES.ADMIN, permissions: [] })

    assertForbiddenRedirect(response)
    await adminRole.refresh()
    assert.isAbove(adminRole.permissions.length, 0)
  })

  test('PUT no role user muda permissoes mas nao o nome', async ({ client, assert }) => {
    const userRole = await Role.findByOrFail('name', ROLES.USER)

    await client
      .put(`/roles/${userRole.id}`)
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .json({ name: 'renamed', permissions: [PERMISSIONS.tokensViewList] })

    await userRole.refresh()
    assert.equal(userRole.name, ROLES.USER)
    assert.deepEqual(userRole.permissions, [PERMISSIONS.tokensViewList])
  })

  test('DELETE remove role customizado sem usuarios', async ({ client, assert }) => {
    const role = await Role.create({ name: 'editor', permissions: [] })

    const response = await client
      .delete(`/roles/${role.id}`)
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
    assert.isNull(await Role.find(role.id))
  })

  test('DELETE de role atribuido eh barrado', async ({ client, assert }) => {
    const role = await Role.create({ name: 'editor', permissions: [] })
    const member = await UserFactory.create()
    await member.assignRole(role)

    const response = await client
      .delete(`/roles/${role.id}`)
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)

    assertForbiddenRedirect(response)
    assert.isNotNull(await Role.find(role.id))
  })

  test('DELETE de role de sistema eh barrado', async ({ client, assert }) => {
    const userRole = await Role.findByOrFail('name', ROLES.USER)

    const response = await client
      .delete(`/roles/${userRole.id}`)
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)

    assertForbiddenRedirect(response)
    assert.isNotNull(await Role.find(userRole.id))
  })

  test('POST /users aceita role customizado', async ({ client, assert }) => {
    await Role.create({ name: 'editor', permissions: [PERMISSIONS.usersViewList] })

    const response = await client
      .post('/users')
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)
      .json({ fullName: 'Editor User', email: 'editor@example.test', role: 'editor' })

    response.assertStatus(302)
    const created = await User.findByOrFail('email', 'editor@example.test')
    assert.deepEqual(await created.getRoleNames(), ['editor'])
    assert.isTrue(await created.hasPermission(PERMISSIONS.usersViewList))
  })

  test('POST /users com role inexistente retorna 422', async ({ client }) => {
    const response = await client
      .post('/users')
      .loginAs(await admin())
      .withCsrfToken()
      .accept('json')
      .redirects(0)
      .json({ fullName: 'Ghost', email: 'ghost@example.test', role: 'ghost' })

    response.assertStatus(422)
  })
})
