import vine from '@vinejs/vine'

import { timeOfDay } from '#rundowns/validators/rundowns'

export const stepValidator = vine.create({
  title: vine.string().trim().minLength(1).maxLength(255),
  stepTypeId: vine.number().withoutDecimals().exists({ table: 'step_types', column: 'id' }),
  plannedDuration: vine.number().withoutDecimals().min(0).max(86_399),
  playedTime: timeOfDay().nullable().optional(),
  waitUntil: timeOfDay().nullable().optional(),
  autoNext: vine.boolean(),
})

export const moveStepValidator = vine.create({
  direction: vine.enum(['up', 'down'] as const),
})
