import vine from '@vinejs/vine'

import { jsonString } from '#context/validators/rules'

const path = () => vine.string().trim().maxLength(255).nullable()

export const createContextValidatorValidator = vine.create({
  path: path(),
})

export const updateContextValidatorValidator = vine.create({
  path: path(),
  schema: vine.string().use(jsonString()),
})
