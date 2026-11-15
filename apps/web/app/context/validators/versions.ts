import vine from '@vinejs/vine'

export const listContextVersionsValidator = vine.create({
  page: vine.number().positive().withoutDecimals().optional(),
})

export const restoreContextVersionValidator = vine.create({
  bypassMutators: vine.boolean().optional(),
})
