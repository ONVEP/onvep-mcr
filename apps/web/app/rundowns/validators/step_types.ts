import vine from '@vinejs/vine'

import StepType from '#rundowns/models/step_type'

const color = () =>
  vine
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/)

export const createStepTypeValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(255).unique({
    table: 'step_types',
    column: 'name',
  }),
  color: color(),
})

export const editStepTypeValidator = vine.withMetaData<{ stepTypeId: number }>().create({
  name: vine
    .string()
    .trim()
    .minLength(1)
    .maxLength(255)
    .unique(async (_, value, field) => {
      const row = await StepType.query()
        .where('name', value)
        .whereNot('id', field.meta.stepTypeId)
        .first()
      return !row
    }),
  color: color(),
})
