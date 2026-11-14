import type Step from '#rundowns/models/step'

export interface DeleteStepInput {
  target: Step
}

export default class DeleteStep {
  async handle(input: DeleteStepInput): Promise<void> {
    await input.target.delete()
  }
}
