import { column } from '@adonisjs/lucid/orm'

import BaseModel from '#common/models/base_model'

export default class CustomCss extends BaseModel {
  static table = 'custom_css'

  @column({ isPrimary: true })
  declare id: number

  // Injected raw into the CG pages' <style>: the validator rejects anything closing the tag.
  @column()
  declare content: string
}
