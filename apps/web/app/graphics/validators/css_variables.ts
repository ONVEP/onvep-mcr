import vine from '@vinejs/vine'

import { CSS_VARIABLE_KINDS } from '#graphics/enums/css_variable_kind'
import CssVariable from '#graphics/models/css_variable'

const fields = {
  kind: vine.enum(CSS_VARIABLE_KINDS),
  // Injected raw into a <style>: no character that could close the declaration, the rule or the tag.
  value: vine
    .string()
    .trim()
    .minLength(1)
    .maxLength(255)
    .regex(/^[^;{}<>\\\r\n]+$/),
}

const name = () =>
  vine
    .string()
    .trim()
    .maxLength(64)
    .regex(/^[a-zA-Z][\w-]*$/)

export const createCssVariableValidator = vine.create({
  name: name().unique({ table: 'css_variables', column: 'name' }),
  ...fields,
})

export const editCssVariableValidator = vine.withMetaData<{ cssVariableId: number }>().create({
  name: name().unique(async (_, value, field) => {
    const row = await CssVariable.query()
      .where('name', value)
      .whereNot('id', field.meta.cssVariableId)
      .first()
    return !row
  }),
  ...fields,
})
