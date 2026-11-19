import { column } from '@adonisjs/lucid/orm'

import BaseModel from '#common/models/base_model'

export default class CompanionServer extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  // Base URL of the Companion web UI, e.g. http://192.168.1.10:8000.
  @column()
  declare url: string

  // Ids (stable, unlike page numbers) of the Companion pages holding the buttons the app may trigger.
  @column({
    prepare: (value: string[]) => JSON.stringify(value ?? []),
    consume: (value: unknown) =>
      Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [],
  })
  declare technicalPages: string[]
}
