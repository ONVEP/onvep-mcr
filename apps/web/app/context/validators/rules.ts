import vine from '@vinejs/vine'

/**
 * Context values and schemas travel JSON-encoded: the body parser turns empty
 * strings into null, which would corrupt `""` values nested in a raw payload.
 */
export const jsonString = vine.createRule((value, _, field) => {
  if (typeof value !== 'string') return
  try {
    JSON.parse(value)
  } catch {
    field.report('The {{ field }} field must be valid JSON', 'json', field)
  }
})
