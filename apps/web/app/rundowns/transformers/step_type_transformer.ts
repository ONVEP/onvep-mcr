import { BaseTransformer } from '@adonisjs/core/transformers'

import type StepType from '#rundowns/models/step_type'

export default class StepTypeTransformer extends BaseTransformer<StepType> {
  toObject() {
    return {
      id: this.resource.id,
      name: this.resource.name,
      color: this.resource.color,
    }
  }

  forOption() {
    return this.toObject()
  }

  forList() {
    return this.toObject()
  }
}
