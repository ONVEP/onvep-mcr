import encryption from '@adonisjs/core/services/encryption'
import { column } from '@adonisjs/lucid/orm'

import BaseModel from '#common/models/base_model'

export default class NetworkDrive extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare url: string

  @column()
  declare username: string

  // Encrypted (not hashed): the plaintext is needed to mount the share.
  @column({
    serializeAs: null,
    prepare: (value: string) => encryption.encrypt(value),
    consume: (value: string) => encryption.decrypt<string>(value),
  })
  declare password: string
}
