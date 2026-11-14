import Layer from '#graphics/models/layer'

export default class ListLayers {
  async handle(options: { enabledOnly?: boolean } = {}): Promise<Layer[]> {
    const query = Layer.query().orderBy('name', 'asc').orderBy('id', 'asc')
    if (options.enabledOnly) query.where('enabled', true)
    return query
  }
}
