import type Step from '#rundowns/models/step'

export interface UpdateStepInput {
  target: Step
  title: string
  stepTypeId: number
  plannedDuration: number
  playedTime?: string | null
  waitUntil?: string | null
  autoNext: boolean
}

export default class UpdateStep {
  async handle(input: UpdateStepInput): Promise<Step> {
    input.target.merge({
      title: input.title,
      stepTypeId: input.stepTypeId,
      plannedDuration: input.plannedDuration,
      playedTime: input.playedTime ?? null,
      waitUntil: input.waitUntil ?? null,
      autoNext: input.autoNext,
    })
    await input.target.save()

    return input.target
  }
}
