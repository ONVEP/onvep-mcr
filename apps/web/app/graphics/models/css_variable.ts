import { column, computed } from '@adonisjs/lucid/orm'

import BaseModel from '#common/models/base_model'
import type { CssVariableKind } from '#graphics/enums/css_variable_kind'

export default class CssVariable extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare kind: CssVariableKind

  // Any CSS value, injected raw into the CG stylesheet: the validator keeps it from escaping its declaration.
  @column()
  declare value: string

  // Colors follow Tailwind's `--color-*` namespace so they also exist as `bg-<name>`, `text-<name>`…
  @computed()
  get property() {
    return this.kind === 'color' ? `--color-${this.name}` : `--${this.name}`
  }
}
