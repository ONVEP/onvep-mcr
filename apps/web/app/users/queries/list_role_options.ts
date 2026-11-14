import Role from '#users/models/role'

export default class ListRoleOptions {
  async handle(): Promise<Role[]> {
    return Role.query().orderBy('id', 'asc')
  }
}
