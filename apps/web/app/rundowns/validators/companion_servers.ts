import vine from '@vinejs/vine'

import CompanionServer from '#rundowns/models/companion_server'

const url = () =>
  vine
    .string()
    .trim()
    .maxLength(2048)
    .url({ protocols: ['http', 'https'], require_protocol: true, require_tld: false })

export const createCompanionServerValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(255).unique({
    table: 'companion_servers',
    column: 'name',
  }),
  url: url(),
})

export const editCompanionServerValidator = vine
  .withMetaData<{ companionServerId: number }>()
  .create({
    name: vine
      .string()
      .trim()
      .minLength(1)
      .maxLength(255)
      .unique(async (_, value, field) => {
        const row = await CompanionServer.query()
          .where('name', value)
          .whereNot('id', field.meta.companionServerId)
          .first()
        return !row
      }),
    url: url(),
    technicalPages: vine
      .array(vine.string().trim().minLength(1).maxLength(64))
      .distinct()
      .optional(),
  })
