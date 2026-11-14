import StepTypeInUseException from '#rundowns/exceptions/step_type_in_use'
import Step from '#rundowns/models/step'
import type StepType from '#rundowns/models/step_type'

export interface DeleteStepTypeInput {
  target: StepType
}

export default class DeleteStepType {
  async handle(input: DeleteStepTypeInput): Promise<void> {
    // steps.step_type_id is ON DELETE RESTRICT: fail with a readable error instead of a 500.
    const used = await Step.query().where('step_type_id', input.target.id).first()
    if (used) throw new StepTypeInUseException()

    await input.target.delete()
  }
}
