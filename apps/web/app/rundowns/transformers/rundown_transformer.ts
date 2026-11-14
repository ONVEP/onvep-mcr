import { BaseTransformer } from '@adonisjs/core/transformers'

import type Rundown from '#rundowns/models/rundown'

export default class RundownTransformer extends BaseTransformer<Rundown> {
  toObject() {
    return {
      id: this.resource.id,
      name: this.resource.name,
      startTime: this.resource.startTime,
    }
  }

  forList() {
    return {
      ...this.toObject(),
      stepsCount: Number(this.resource.$extras.steps_count ?? 0),
    }
  }

  forEdit() {
    return this.toObject()
  }

  forShow() {
    return this.toObject()
  }
}
