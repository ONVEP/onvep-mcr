import Factory from '@adonisjs/lucid/factories'

import CssVariable from '#graphics/models/css_variable'

export const CssVariableFactory = Factory.define(CssVariable, ({ faker }) => ({
  name: `var-${faker.string.alphanumeric(8).toLowerCase()}`,
  kind: 'value' as const,
  value: '12px',
})).build()
