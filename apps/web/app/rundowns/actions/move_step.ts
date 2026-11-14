import db from '@adonisjs/lucid/services/db'

import Step from '#rundowns/models/step'

export interface MoveStepInput {
  target: Step
  direction: 'up' | 'down'
}

export default class MoveStep {
  // Swaps `order` with the adjacent step; a no-op at either end of the rundown.
  async handle(input: MoveStepInput): Promise<void> {
    await db.transaction(async (trx) => {
      const step = input.target.useTransaction(trx)

      const neighbour = await Step.query({ client: trx })
        .where('rundown_id', step.rundownId)
        .if(
          input.direction === 'up',
          (q) => q.where('order', '<', step.order).orderBy('order', 'desc'),
          (q) => q.where('order', '>', step.order).orderBy('order', 'asc')
        )
        .first()

      if (!neighbour) return

      const order = step.order
      step.order = neighbour.order
      neighbour.order = order
      await step.save()
      await neighbour.save()
    })
  }
}
