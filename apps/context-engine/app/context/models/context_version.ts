import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { DateTime } from 'luxon'
import type { JsonObject } from '#context/lib/path'

export default class ContextVersion extends BaseModel {
  static table = 'context_versions'

  @column({ isPrimary: true })
  declare id: number

  @column({ prepare: (value: JsonObject) => JSON.stringify(value) })
  declare context: JsonObject

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
}
