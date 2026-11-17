import vine from '@vinejs/vine'

/**
 * Write payloads wrap the JSON value so primitives and `null` can be sent.
 */
export const contextValueValidator = vine.create({
  value: vine.any().nullable(),
})

export const listVersionsValidator = vine.create({
  page: vine.number().positive().withoutDecimals().optional(),
  perPage: vine.number().positive().withoutDecimals().max(100).optional(),
})

export const restoreVersionValidator = vine.create({
  bypassMutators: vine.boolean().optional(),
})

export const mutatorSourceValidator = vine.create({
  source: vine.string(),
})

export const validatorDefinitionValidator = vine.create({
  path: vine.string(),
  schema: vine.object({}).allowUnknownProperties(),
  enabled: vine.boolean().optional(),
})

export const enabledValidator = vine.create({
  enabled: vine.boolean(),
})
