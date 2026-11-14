import type Rundown from '#rundowns/models/rundown'
import Step from '#rundowns/models/step'

export interface CreateStepInput {
  rundown: Rundown
  title: string
  stepTypeId: number
  plannedDuration: number
  playedTime?: string | null
  waitUntil?: string | null
  autoNext: boolean
}

export default class CreateStep {
  async handle(input: CreateStepInput): Promise<Step> {
    const last = await Step.query()
      .where('rundown_id', input.rundown.id)
      .orderBy('order', 'desc')
      .first()

    return Step.create({
      rundownId: input.rundown.id,
      order: (last?.order ?? 0) + 1,
      title: input.title,
      stepTypeId: input.stepTypeId,
      plannedDuration: input.plannedDuration,
      playedTime: input.playedTime ?? null,
      waitUntil: input.waitUntil ?? null,
      autoNext: input.autoNext,
    })
  }
}
