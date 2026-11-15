import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { DateTime } from 'luxon'
import type { JsonObject } from '#context/lib/path'

export default class ContextValidator extends BaseModel {
  static table = 'context_validators'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare path: string

  @column({ prepare: (value: JsonObject) => JSON.stringify(value) })
  declare schema: JsonObject

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
