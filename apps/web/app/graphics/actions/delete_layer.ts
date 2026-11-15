import type Layer from '#graphics/models/layer'
import { reloadCgPages } from '#graphics/services/cg_live_reload'

export interface DeleteLayerInput {
  target: Layer
}

export default class DeleteLayer {
  async handle(input: DeleteLayerInput): Promise<void> {
    await input.target.delete()
    reloadCgPages([input.target.slug])
  }
}
