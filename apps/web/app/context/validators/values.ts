import vine from '@vinejs/vine'

import { jsonString } from '#context/validators/rules'

export const contextValueValidator = vine.create({
  // Null for the root: the body parser turns '' into null.
  path: vine.string().nullable(),
  value: vine.string().use(jsonString()),
})

export const contextPathValidator = vine.create({
  path: vine.string().minLength(1),
})
