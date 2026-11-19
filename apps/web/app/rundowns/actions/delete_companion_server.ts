import type CompanionServer from '#rundowns/models/companion_server'

export interface DeleteCompanionServerInput {
  target: CompanionServer
}

export default class DeleteCompanionServer {
  async handle(input: DeleteCompanionServerInput): Promise<void> {
    await input.target.delete()
  }
}
