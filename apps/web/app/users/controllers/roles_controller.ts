import type { HttpContext } from '@adonisjs/core/http'

import CreateRole from '#users/actions/create_role'
import DeleteRole from '#users/actions/delete_role'
import UpdateRole from '#users/actions/update_role'
import Role from '#users/models/role'
import RolePolicy from '#users/policies/role_policy'
import CountRoleUsers from '#users/queries/count_role_users'
import ListRoles from '#users/queries/list_roles'
import RoleTransformer from '#users/transformers/role_transformer'
import { createRoleValidator, editRoleValidator } from '#users/validators/roles'

export default class RolesController {
  public async index({ bouncer, inertia }: HttpContext) {
    await bouncer.with(RolePolicy).authorize('viewList')

    const roles = await new ListRoles().handle()

    return inertia.render('users/roles/index', {
      roles: RoleTransformer.transform(roles).useVariant('forList'),
    })
  }

  public async create({ bouncer, inertia }: HttpContext) {
    await bouncer.with(RolePolicy).authorize('create')

    return inertia.modal('users/roles/create', {}, { route: 'roles.index' })
  }

  public async store({ bouncer, request, response }: HttpContext) {
    await bouncer.with(RolePolicy).authorize('create')

    const payload = await request.validateUsing(createRoleValidator)

    await new CreateRole().handle(payload)

    return response.redirect().toRoute('roles.index')
  }

  public async edit({ bouncer, inertia, params }: HttpContext) {
    const role = await Role.findOrFail(params.id)

    await bouncer.with(RolePolicy).authorize('update', role)

    return inertia.modal(
      'users/roles/edit',
      { role: RoleTransformer.transform(role).useVariant('forEdit') },
      { route: 'roles.index' }
    )
  }

  public async update({ bouncer, params, request, response }: HttpContext) {
    const role = await Role.findOrFail(params.id)

    await bouncer.with(RolePolicy).authorize('update', role)

    const payload = await request.validateUsing(editRoleValidator, { meta: { roleId: role.id } })

    await new UpdateRole().handle({
      target: role,
      name: payload.name,
      permissions: payload.permissions,
    })

    return response.redirect().toRoute('roles.index')
  }

  public async destroy({ bouncer, params, response }: HttpContext) {
    const role = await Role.findOrFail(params.id)
    const usersCount = await new CountRoleUsers().handle(role)

    await bouncer.with(RolePolicy).authorize('delete', role, usersCount)

    await new DeleteRole().handle({ target: role })

    return response.redirect().toRoute('roles.index')
  }
}
