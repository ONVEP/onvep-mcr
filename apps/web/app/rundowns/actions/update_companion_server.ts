import type CompanionServer from '#rundowns/models/companion_server'

export interface UpdateCompanionServerInput {
  target: CompanionServer
  name: string
  url: string
  technicalPages?: string[]
}

export default class UpdateCompanionServer {
  async handle(input: UpdateCompanionServerInput): Promise<CompanionServer> {
    input.target.merge({ name: input.name, url: input.url })
    if (input.technicalPages) input.target.technicalPages = input.technicalPages
    await input.target.save()

    return input.target
  }
}
