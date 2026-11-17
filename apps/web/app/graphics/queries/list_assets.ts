import Asset from '#graphics/models/asset'

export default class ListAssets {
  async handle(): Promise<Asset[]> {
    return Asset.query().orderBy('name', 'asc')
  }
}
