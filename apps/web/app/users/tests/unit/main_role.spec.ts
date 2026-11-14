import { test } from '@japa/runner'

import { ROLES, mainRole } from '#users/enums/role'

test.group('mainRole', () => {
  test('retorna null quando array vazio', ({ assert }) => {
    assert.isNull(mainRole([]))
  })

  test('retorna o primeiro role customizado quando nenhum role de sistema', ({ assert }) => {
    assert.equal(mainRole(['editor', 'guest']), 'editor')
  })

  test('retorna o unico role conhecido', ({ assert }) => {
    assert.equal(mainRole([ROLES.USER]), ROLES.USER)
    assert.equal(mainRole([ROLES.ADMIN]), ROLES.ADMIN)
  })

  test('admin ganha de user por peso', ({ assert }) => {
    assert.equal(mainRole([ROLES.USER, ROLES.ADMIN]), ROLES.ADMIN)
    assert.equal(mainRole([ROLES.ADMIN, ROLES.USER]), ROLES.ADMIN)
  })

  test('role customizado fica entre user e admin', ({ assert }) => {
    assert.equal(mainRole([ROLES.USER, 'editor']), 'editor')
    assert.equal(mainRole(['editor', ROLES.ADMIN]), ROLES.ADMIN)
  })
})
