import Role from '#users/models/role'

export default class ListRoles {
  async handle(): Promise<Role[]> {
    return Role.query().withCount('users').orderBy('id', 'asc')
  }
}
