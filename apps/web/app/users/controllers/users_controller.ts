import type { HttpContext } from '@adonisjs/core/http'

import CreateUser from '#users/actions/create_user'
import DeleteUser from '#users/actions/delete_user'
import UpdateUser from '#users/actions/update_user'
import User from '#users/models/user'
import UserPolicy from '#users/policies/user_policy'
import ListRoleOptions from '#users/queries/list_role_options'
import ListUsers from '#users/queries/list_users'
import RoleTransformer from '#users/transformers/role_transformer'
import UserTransformer from '#users/transformers/user_transformer'
import { createUserValidator, editUserValidator, listUserValidator } from '#users/validators/users'

export default class UsersController {
  public async index({ bouncer, inertia, request }: HttpContext) {
    await bouncer.with(UserPolicy).authorize('viewList')

    const payload = await request.validateUsing(listUserValidator)

    const users = await new ListUsers().handle(
      { q: payload.q, roles: payload.roles, sort: payload.sort, order: payload.order },
      { page: payload.page ?? 1, perPage: payload.perPage ?? 10 }
    )

    const usersData = users.all()
    await User.preComputeUrls(usersData)

    return inertia.render('users/index', {
      roleOptions: await this.roleOptions(),
      users: UserTransformer.paginate(usersData, users.getMeta()).useVariant('forList'),
      q: payload.q,
      selectedRoles: payload.roles ?? [],
      sort: payload.sort ?? null,
      order: payload.order ?? null,
    })
  }

  public async create({ bouncer, inertia }: HttpContext) {
    await bouncer.with(UserPolicy).authorize('create')

    return inertia.modal(
      'users/create',
      { roleOptions: await this.roleOptions() },
      { route: 'users.index' }
    )
  }

  public async store({ auth, bouncer, request, response }: HttpContext) {
    await bouncer.with(UserPolicy).authorize('create')

    const payload = await request.validateUsing(createUserValidator)

    await new CreateUser().handle({
      fullName: payload.fullName,
      email: payload.email,
      role: payload.role,
      password: payload.password,
      executor: auth.user!,
    })

    return response.redirect().toRoute('users.index')
  }

  public async edit({ bouncer, inertia, params }: HttpContext) {
    const user = await User.findOrFail(params.id)
    await user.load('roles')

    await bouncer.with(UserPolicy).authorize('update', user)

    return inertia.modal(
      'users/edit',
      {
        user: UserTransformer.transform(user).useVariant('forEdit'),
        roleOptions: await this.roleOptions(),
      },
      { route: 'users.index' }
    )
  }

  public async update({ auth, bouncer, params, request, response }: HttpContext) {
    const user = await User.findOrFail(params.id)

    await bouncer.with(UserPolicy).authorize('update', user)

    const payload = await request.validateUsing(editUserValidator, { meta: { userId: params.id } })

    await new UpdateUser().handle({
      target: user,
      fullName: payload.fullName,
      email: payload.email,
      role: payload.role,
      password: payload.password,
      executor: auth.user!,
    })

    return response.redirect().toRoute('users.index')
  }

  public async destroy({ bouncer, params, response }: HttpContext) {
    const user = await User.findOrFail(params.id)

    await bouncer.with(UserPolicy).authorize('delete', user)

    await new DeleteUser().handle({ target: user })

    return response.redirect().toRoute('users.index')
  }

  private async roleOptions() {
    const roles = await new ListRoleOptions().handle()
    return RoleTransformer.transform(roles).useVariant('forOption')
  }
}
