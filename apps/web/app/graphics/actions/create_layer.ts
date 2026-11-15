import Layer from '#graphics/models/layer'
import { reloadCgPages } from '#graphics/services/cg_live_reload'
import { uniqueLayerSlug } from '#graphics/services/unique_layer_slug'

export interface CreateLayerInput {
  name: string
}

export default class CreateLayer {
  async handle(input: CreateLayerInput): Promise<Layer> {
    const layer = await Layer.create({
      name: input.name,
      slug: await uniqueLayerSlug(input.name),
      enabled: true,
      content: '',
    })
    reloadCgPages([layer.slug])

    return layer
  }
}
