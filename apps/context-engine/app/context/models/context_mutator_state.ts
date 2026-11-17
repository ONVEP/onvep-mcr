import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { DateTime } from 'luxon'

export default class ContextMutatorState extends BaseModel {
  static table = 'context_mutator_states'
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare name: string

  @column()
  declare enabled: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
