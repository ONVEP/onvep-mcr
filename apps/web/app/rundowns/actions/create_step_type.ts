import StepType from '#rundowns/models/step_type'

export interface CreateStepTypeInput {
  name: string
  color: string
}

export default class CreateStepType {
  async handle(input: CreateStepTypeInput): Promise<StepType> {
    return StepType.create({ name: input.name, color: input.color.toLowerCase() })
  }
}
