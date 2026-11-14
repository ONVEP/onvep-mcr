import Rundown from '#rundowns/models/rundown'

export interface CreateRundownInput {
  name: string
  startTime?: string
}

export default class CreateRundown {
  async handle(input: CreateRundownInput): Promise<Rundown> {
    return Rundown.create({ name: input.name, startTime: input.startTime ?? '00:00:00' })
  }
}
