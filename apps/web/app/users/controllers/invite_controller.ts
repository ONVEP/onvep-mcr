import type { HttpContext } from '@adonisjs/core/http'

import InviteUser from '#users/actions/invite_user'
import UserPolicy from '#users/policies/user_policy'
import ListRoleOptions from '#users/queries/list_role_options'
import RoleTransformer from '#users/transformers/role_transformer'
import { inviteUserValidator } from '#users/validators/users'

export default class InviteController {
  public async show({ bouncer, inertia }: HttpContext) {
    await bouncer.with(UserPolicy).authorize('invite')

    const roles = await new ListRoleOptions().handle()

    return inertia.modal(
      'users/invite',
      { roleOptions: RoleTransformer.transform(roles).useVariant('forOption') },
      { route: 'users.index' }
    )
  }

  public async handle({ auth, i18n, bouncer, request, response }: HttpContext) {
    await bouncer.with(UserPolicy).authorize('invite')

    const payload = await request.validateUsing(inviteUserValidator)

    await new InviteUser().handle({
      email: payload.email,
      role: payload.role,
      description: payload.description,
      executor: auth.user!,
      i18n,
    })

    return response.redirect().toRoute('users.index')
  }
}
