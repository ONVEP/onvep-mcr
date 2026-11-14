import { column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'

import BaseModel from '#common/models/base_model'

import Step from '#rundowns/models/step'

export default class Rundown extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  // Time of day, HH:MM:SS.
  @column()
  declare startTime: string

  @hasMany(() => Step)
  declare steps: HasMany<typeof Step>
}
