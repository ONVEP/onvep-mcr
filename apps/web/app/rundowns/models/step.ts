import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

import BaseModel from '#common/models/base_model'

import Rundown from '#rundowns/models/rundown'
import StepType from '#rundowns/models/step_type'

export default class Step extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare rundownId: number

  @column()
  declare stepTypeId: number

  @column()
  declare order: number

  @column()
  declare title: string

  // Seconds.
  @column()
  declare plannedDuration: number

  // Time of day the step actually started, HH:MM:SS. Null until played.
  @column()
  declare playedTime: string | null

  // Hard start time, HH:MM:SS: overrides the computed planned time when set.
  @column()
  declare waitUntil: string | null

  @column()
  declare autoNext: boolean

  @belongsTo(() => Rundown)
  declare rundown: BelongsTo<typeof Rundown>

  @belongsTo(() => StepType)
  declare stepType: BelongsTo<typeof StepType>
}
