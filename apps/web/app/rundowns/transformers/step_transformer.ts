import { BaseTransformer } from '@adonisjs/core/transformers'

import type Step from '#rundowns/models/step'

export default class StepTransformer extends BaseTransformer<Step> {
  toObject() {
    return {
      id: this.resource.id,
      order: this.resource.order,
      title: this.resource.title,
      stepTypeId: this.resource.stepTypeId,
      plannedDuration: this.resource.plannedDuration,
      playedTime: this.resource.playedTime,
      waitUntil: this.resource.waitUntil,
      autoNext: this.resource.autoNext,
    }
  }

  // Expects the step to come from GetRundownSteps (stepType preloaded, plannedPlayTime computed).
  forTimeline() {
    return {
      ...this.toObject(),
      plannedPlayTime: this.resource.$extras.plannedPlayTime as string,
      stepType: {
        id: this.resource.stepType.id,
        name: this.resource.stepType.name,
        color: this.resource.stepType.color,
      },
    }
  }
}
