import type Layer from '#graphics/models/layer'

export interface DeleteLayerInput {
  target: Layer
}

export default class DeleteLayer {
  async handle(input: DeleteLayerInput): Promise<void> {
    await input.target.delete()
  }
}
