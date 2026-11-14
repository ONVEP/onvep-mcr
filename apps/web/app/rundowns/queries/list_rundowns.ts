import Rundown from '#rundowns/models/rundown'

export default class ListRundowns {
  async handle(): Promise<Rundown[]> {
    return Rundown.query().withCount('steps').orderBy('name', 'asc').orderBy('id', 'asc')
  }
}
