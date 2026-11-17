import Factory from '@adonisjs/lucid/factories'
import { attachmentManager } from '@jrmc/adonis-attachment'

import Asset from '#graphics/models/asset'

export const AssetFactory = Factory.define(Asset, async ({ faker }) => ({
  name: `asset-${faker.string.alphanumeric(8).toLowerCase()}.txt`,
  file: await attachmentManager.createFromBuffer(Buffer.from('hello'), 'hello.txt'),
})).build()
