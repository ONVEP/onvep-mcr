import vine from '@vinejs/vine'

// Accepts HH:MM (what <input type="time"> sends when seconds are 0) and normalizes to HH:MM:SS.
export const timeOfDay = () =>
  vine
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    .transform((value) => (value?.length === 5 ? `${value}:00` : value))

export const rundownValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(255),
  startTime: timeOfDay().optional(),
})
