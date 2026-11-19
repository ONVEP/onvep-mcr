import CompanionServer from '#rundowns/models/companion_server'

export interface CreateCompanionServerInput {
  name: string
  url: string
}

export default class CreateCompanionServer {
  async handle(input: CreateCompanionServerInput): Promise<CompanionServer> {
    return CompanionServer.create({ name: input.name, url: input.url, technicalPages: [] })
  }
}
