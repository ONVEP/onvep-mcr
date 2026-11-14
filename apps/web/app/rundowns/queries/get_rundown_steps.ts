import type Rundown from '#rundowns/models/rundown'
import Step from '#rundowns/models/step'
import { plannedPlayTimes } from '#rundowns/services/planned_play_times'

/**
 * Steps of a rundown in play order, each carrying its computed
 * `$extras.plannedPlayTime` (HH:MM:SS) for StepTransformer.forTimeline.
 */
export default class GetRundownSteps {
  async handle(rundown: Rundown): Promise<Step[]> {
    const steps = await Step.query()
      .where('rundown_id', rundown.id)
      .preload('stepType')
      .orderBy('order', 'asc')
      .orderBy('id', 'asc')

    const times = plannedPlayTimes(rundown.startTime, steps)
    steps.forEach((step, index) => {
      step.$extras.plannedPlayTime = times[index]
    })

    return steps
  }
}
