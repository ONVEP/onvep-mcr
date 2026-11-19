import CompanionServer from '#rundowns/models/companion_server'

export default class ListCompanionServers {
  async handle(): Promise<CompanionServer[]> {
    return CompanionServer.query().orderBy('name', 'asc')
  }
}
