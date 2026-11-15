import vine from '@vinejs/vine'

export const updateCustomCssValidator = vine.create({
  // Null when cleared: the body parser turns empty strings into null.
  content: vine
    .string()
    .maxLength(200_000)
    // Injected raw into a <style>: it must not be able to close the tag.
    .regex(/^(?![\s\S]*<\/style)/i)
    .nullable(),
})
