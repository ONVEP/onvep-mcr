import type Asset from '#graphics/models/asset'
import { reloadCgPages } from '#graphics/services/cg_live_reload'

export interface DeleteAssetInput {
  target: Asset
}

export default class DeleteAsset {
  async handle(input: DeleteAssetInput): Promise<void> {
    await input.target.delete()
    reloadCgPages()
  }
}
