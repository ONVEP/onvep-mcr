import vine from '@vinejs/vine'

import Role from '#users/models/role'
import { ALL_PERMISSIONS } from '#users/enums/permission'

const permissions = () => vine.array(vine.enum(ALL_PERMISSIONS)).distinct()

export const createRoleValidator = vine.create({
  name: vine.string().trim().minLength(2).maxLength(50).unique({ table: 'roles', column: 'name' }),
  permissions: permissions(),
})

export const editRoleValidator = vine.withMetaData<{ roleId: number }>().create({
  name: vine
    .string()
    .trim()
    .minLength(2)
    .maxLength(50)
    .unique(async (_, value, field) => {
      const row = await Role.query().where('name', value).whereNot('id', field.meta.roleId).first()
      return !row
    }),
  permissions: permissions(),
})
