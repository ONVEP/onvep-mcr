import { column } from '@adonisjs/lucid/orm'
import { attachment } from '@jrmc/adonis-attachment'
import type { Attachment } from '@jrmc/adonis-attachment/types/attachment'

import BaseModel from '#common/models/base_model'

export default class Asset extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  // No meta: it would probe every upload, multi-GB videos included.
  @attachment({ preComputeUrl: false, meta: false })
  declare file: Attachment
}
