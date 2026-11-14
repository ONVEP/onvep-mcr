import Factory from '@adonisjs/lucid/factories'

import Rundown from '#rundowns/models/rundown'
import Step from '#rundowns/models/step'
import StepType from '#rundowns/models/step_type'

export const StepTypeFactory = Factory.define(StepType, ({ faker }) => {
  return {
    name: faker.string.alphanumeric(10),
    color: faker.color.rgb(),
  }
}).build()

export const StepFactory = Factory.define(Step, ({ faker }) => {
  return {
    order: 1,
    title: faker.lorem.words(3),
    plannedDuration: 60,
    playedTime: null,
    autoNext: false,
  }
})
  .relation('stepType', () => StepTypeFactory)
  // A step always needs a type; create one unless the caller set it.
  // Must reuse the factory's transaction, or the insert waits on its locks.
  .before('create', async (_, step, ctx) => {
    if (step.stepTypeId) return
    const builder = ctx.$trx ? StepTypeFactory.client(ctx.$trx) : StepTypeFactory
    const stepType = await builder.create()
    step.stepTypeId = stepType.id
  })
  .build()

export const RundownFactory = Factory.define(Rundown, ({ faker }) => {
  return {
    name: faker.lorem.words(2),
    startTime: '00:00:00',
  }
})
  .relation('steps', () => StepFactory)
  .build()
