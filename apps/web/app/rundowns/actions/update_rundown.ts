import type Rundown from '#rundowns/models/rundown'

export interface UpdateRundownInput {
  target: Rundown
  name: string
  startTime?: string
}

export default class UpdateRundown {
  async handle(input: UpdateRundownInput): Promise<Rundown> {
    input.target.merge({
      name: input.name,
      startTime: input.startTime ?? input.target.startTime,
    })
    await input.target.save()

    return input.target
  }
}
