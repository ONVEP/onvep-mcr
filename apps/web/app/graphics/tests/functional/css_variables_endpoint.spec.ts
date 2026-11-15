import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

import { ROLES } from '#users/enums/role'
import { UserFactory } from '#users/database/factories/user'
import { CssVariableFactory } from '#graphics/database/factories/css_variables'
import { LayerFactory } from '#graphics/database/factories/layers'
import CssVariable from '#graphics/models/css_variable'
import GetCustomCss from '#graphics/queries/get_custom_css'
import { assertForbiddenRedirect } from '#tests/helpers/http'
import { ensureBaseRoles, withRole } from '#tests/helpers/rbac'

async function admin() {
  const user = await UserFactory.create()
  await withRole(user, ROLES.ADMIN)
  return user
}

test.group('Endpoint /graphics/css-variables', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())
  group.each.setup(() => ensureBaseRoles())

  test('GET sans permission est refusé', async ({ client }) => {
    const user = await UserFactory.create()
    await withRole(user, ROLES.USER)

    const response = await client.get('/graphics/css-variables').loginAs(user).redirects(0)
    assertForbiddenRedirect(response)
  })

  test('GET liste les variables avec leur propriété CSS', async ({ client, assert }) => {
    await CssVariable.query().delete()
    await CssVariableFactory.merge({ name: 'brand', kind: 'color', value: '#ff0000' }).create()
    await CssVariableFactory.merge({ name: 'gap', kind: 'value', value: '12px' }).create()

    const response = await client
      .get('/graphics/css-variables')
      .loginAs(await admin())
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('graphics/css_variables')
    assert.deepEqual(
      response.inertiaProps.cssVariables.map((v: { property: string }) => v.property),
      ['--color-brand', '--gap']
    )
  })

  test('POST crée une variable', async ({ client, assert }) => {
    const response = await client
      .post('/graphics/css-variables')
      .withCsrfToken()
      .json({ name: 'accent', kind: 'color', value: 'rgb(0 0 0 / 50%)' })
      .loginAs(await admin())
      .redirects(0)

    response.assertStatus(302)
    const variable = await CssVariable.findByOrFail('name', 'accent')
    assert.equal(variable.value, 'rgb(0 0 0 / 50%)')
  })

  test('POST refuse un nom déjà pris', async ({ client, assert }) => {
    await CssVariableFactory.merge({ name: 'taken' }).create()

    await client
      .post('/graphics/css-variables')
      .withCsrfToken()
      .json({ name: 'taken', kind: 'value', value: '1px' })
      .loginAs(await admin())
      .redirects(0)

    assert.lengthOf(await CssVariable.query().where('name', 'taken'), 1)
  })

  test('POST refuse une valeur qui sortirait de la déclaration', async ({ client, assert }) => {
    for (const value of ['red; } body { display: none', '</style><script>', 'a\\62']) {
      await client
        .post('/graphics/css-variables')
        .withCsrfToken()
        .json({ name: 'evil', kind: 'value', value })
        .loginAs(await admin())
        .redirects(0)
    }

    assert.isNull(await CssVariable.findBy('name', 'evil'))
  })

  test('PUT modifie une variable', async ({ client, assert }) => {
    const variable = await CssVariableFactory.merge({ name: 'old' }).create()

    const response = await client
      .put(`/graphics/css-variables/${variable.id}`)
      .withCsrfToken()
      .json({ name: 'new', kind: 'value', value: '2rem' })
      .loginAs(await admin())
      .redirects(0)

    response.assertStatus(302)
    await variable.refresh()
    assert.equal(variable.name, 'new')
    assert.equal(variable.value, '2rem')
  })

  test('DELETE supprime une variable', async ({ client, assert }) => {
    const variable = await CssVariableFactory.create()

    const response = await client
      .delete(`/graphics/css-variables/${variable.id}`)
      .withCsrfToken()
      .loginAs(await admin())
      .redirects(0)

    response.assertStatus(302)
    assert.isNull(await CssVariable.find(variable.id))
  })

  test('les pages CG déclarent les variables et le thème Tailwind', async ({ client, assert }) => {
    await CssVariable.query().delete()
    await CssVariableFactory.merge({ name: 'brand', kind: 'color', value: '#ff0000' }).create()
    await CssVariableFactory.merge({
      name: 'font',
      kind: 'value',
      value: '"Inter", sans-serif',
    }).create()
    await LayerFactory.merge({ slug: 'lower-third' }).create()

    const response = await client.get('/cg/layer/lower-third')

    const html = response.text()
    assert.include(html, '--color-brand: #ff0000;')
    assert.include(html, '--font: "Inter", sans-serif;')
    assert.match(
      html,
      /<style type="text\/tailwindcss">\s*@theme \{\s*--color-brand: #ff0000;\s*\}/
    )
  })
})

test.group('Endpoint /graphics/css-variables/stylesheet', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())
  group.each.setup(() => ensureBaseRoles())

  test('PUT enregistre le CSS, injecté dans les pages CG et la page admin', async ({
    client,
    assert,
  }) => {
    const user = await admin()
    const css = '.title { color: var(--color-brand); }'

    const response = await client
      .put('/graphics/css-variables/stylesheet')
      .withCsrfToken()
      .json({ content: css })
      .loginAs(user)
      .redirects(0)
    response.assertStatus(302)

    await LayerFactory.merge({ slug: 'styled' }).create()
    const page = await client.get('/cg/layer/styled')
    assert.include(page.text(), css)

    const adminPage = await client.get('/graphics/css-variables').loginAs(user).withInertia()
    assert.equal(adminPage.inertiaProps.customCss, css)
  })

  test('PUT refuse un CSS qui fermerait la balise style', async ({ client, assert }) => {
    await client
      .put('/graphics/css-variables/stylesheet')
      .withCsrfToken()
      .json({ content: 'a{}</STYLE><script>alert(1)</script>' })
      .loginAs(await admin())
      .redirects(0)

    assert.equal(await new GetCustomCss().handle(), '')
  })

  test('PUT accepte un CSS vide', async ({ client, assert }) => {
    const response = await client
      .put('/graphics/css-variables/stylesheet')
      .withCsrfToken()
      .json({ content: '' })
      .loginAs(await admin())
      .redirects(0)

    response.assertStatus(302)
    assert.equal(await new GetCustomCss().handle(), '')
  })
})
