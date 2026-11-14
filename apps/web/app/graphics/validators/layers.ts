import vine from '@vinejs/vine'

const name = () => vine.string().trim().minLength(1).maxLength(255)

export const createLayerValidator = vine.create({
  name: name(),
})

// Partial: the editor saves the name, the enabled flag and the content independently.
export const updateLayerValidator = vine.create({
  name: name().optional(),
  enabled: vine.boolean().optional(),
  // Null when cleared: the body parser turns empty strings into null.
  content: vine.string().maxLength(1_000_000).nullable().optional(),
})
