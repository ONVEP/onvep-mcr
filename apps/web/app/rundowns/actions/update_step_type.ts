import type StepType from '#rundowns/models/step_type'

export interface UpdateStepTypeInput {
  target: StepType
  name: string
  color: string
}

export default class UpdateStepType {
  async handle(input: UpdateStepTypeInput): Promise<StepType> {
    input.target.merge({ name: input.name, color: input.color.toLowerCase() })
    await input.target.save()

    return input.target
  }
}
