import Factory from '@adonisjs/lucid/factories'

import Layer from '#graphics/models/layer'

export const LayerFactory = Factory.define(Layer, ({ faker }) => {
  const name = faker.lorem.words(2)
  return {
    name,
    slug: `${faker.helpers.slugify(name).toLowerCase()}-${faker.string.alphanumeric(6).toLowerCase()}`,
    enabled: true,
    content: '<p>Hello</p>',
  }
}).build()
