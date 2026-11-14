import StepType from '#rundowns/models/step_type'

export default class ListStepTypes {
  async handle(): Promise<StepType[]> {
    return StepType.query().orderBy('name', 'asc')
  }
}
