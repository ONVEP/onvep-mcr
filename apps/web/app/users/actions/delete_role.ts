import type Role from '#users/models/role'

export interface DeleteRoleInput {
  target: Role
}

export default class DeleteRole {
  async handle(input: DeleteRoleInput): Promise<void> {
    await input.target.delete()
  }
}
