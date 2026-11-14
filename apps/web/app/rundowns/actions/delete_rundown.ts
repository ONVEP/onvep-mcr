import type Rundown from '#rundowns/models/rundown'

export interface DeleteRundownInput {
  target: Rundown
}

export default class DeleteRundown {
  async handle(input: DeleteRundownInput): Promise<void> {
    await input.target.delete()
  }
}
