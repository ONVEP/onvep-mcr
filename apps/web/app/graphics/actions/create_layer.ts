import Layer from '#graphics/models/layer'
import { uniqueLayerSlug } from '#graphics/services/unique_layer_slug'

export interface CreateLayerInput {
  name: string
}

export default class CreateLayer {
  async handle(input: CreateLayerInput): Promise<Layer> {
    return Layer.create({
      name: input.name,
      slug: await uniqueLayerSlug(input.name),
      enabled: true,
      content: '',
    })
  }
}
