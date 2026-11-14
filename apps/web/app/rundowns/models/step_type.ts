import { column } from '@adonisjs/lucid/orm'

import BaseModel from '#common/models/base_model'

export default class StepType extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  // Hex, e.g. #ef4444.
  @column()
  declare color: string
}
