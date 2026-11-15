import { BaseTransformer } from '@adonisjs/core/transformers'

import type CssVariable from '#graphics/models/css_variable'

export default class CssVariableTransformer extends BaseTransformer<CssVariable> {
  toObject() {
    return {
      id: this.resource.id,
      name: this.resource.name,
      kind: this.resource.kind,
      value: this.resource.value,
      property: this.resource.property,
    }
  }

  forList() {
    return this.toObject()
  }
}
