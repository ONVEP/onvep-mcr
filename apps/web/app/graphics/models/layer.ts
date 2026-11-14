import { column } from '@adonisjs/lucid/orm'

import BaseModel from '#common/models/base_model'

export default class Layer extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare enabled: boolean

  @column()
  declare content: string
}
