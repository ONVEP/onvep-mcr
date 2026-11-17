import vine from '@vinejs/vine'

export const stateValidator = vine.create({
  enabled: vine.boolean(),
})
