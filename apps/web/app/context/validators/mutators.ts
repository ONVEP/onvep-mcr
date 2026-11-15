import vine from '@vinejs/vine'

export const createMutatorValidator = vine.create({
  // Folders allowed ("layers/sync"); the .js extension is added when missing.
  name: vine
    .string()
    .trim()
    .regex(/^[\w-]+(\/[\w-]+)*(\.m?js)?$/),
})

export const updateMutatorValidator = vine.create({
  // Null when cleared: the body parser turns empty strings into null.
  source: vine.string().maxLength(1_000_000).nullable(),
})
