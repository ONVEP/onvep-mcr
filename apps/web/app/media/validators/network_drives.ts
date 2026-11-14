import vine from '@vinejs/vine'

import { baseSearchValidator } from '#common/validators/search'

import NetworkDrive from '#media/models/network_drive'

const NETWORK_DRIVE_PROTOCOLS = ['smb', 'nfs', 'afp']

const url = () =>
  vine
    .string()
    .trim()
    .maxLength(2048)
    .url({ protocols: NETWORK_DRIVE_PROTOCOLS, require_protocol: true, require_tld: false })

export const createNetworkDriveValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(255).unique({
    table: 'network_drives',
    column: 'name',
  }),
  url: url(),
  username: vine.string().trim().minLength(1).maxLength(255),
  password: vine.string().minLength(1).maxLength(255),
})

export const editNetworkDriveValidator = vine.withMetaData<{ networkDriveId: number }>().create({
  name: vine
    .string()
    .trim()
    .minLength(1)
    .maxLength(255)
    .unique(async (_, value, field) => {
      const row = await NetworkDrive.query()
        .where('name', value)
        .whereNot('id', field.meta.networkDriveId)
        .first()
      return !row
    }),
  url: url(),
  username: vine.string().trim().minLength(1).maxLength(255),
  // Blank keeps the stored password.
  password: vine.string().maxLength(255).optional(),
})

export const listNetworkDriveValidator = vine.create({
  ...baseSearchValidator.getProperties(),
})
