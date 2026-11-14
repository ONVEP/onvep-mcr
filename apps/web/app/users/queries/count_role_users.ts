import db from '@adonisjs/lucid/services/db'

import type Role from '#users/models/role'

export default class CountRoleUsers {
  async handle(role: Role): Promise<number> {
    const row = await db.from('user_roles').where('role_id', role.id).count('* as total').first()
    return Number(row?.total ?? 0)
  }
}
