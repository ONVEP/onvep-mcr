import type { MultipartFile } from '@adonisjs/core/types/bodyparser'
import { attachmentManager } from '@jrmc/adonis-attachment'

import type Asset from '#graphics/models/asset'
import { reloadCgPages } from '#graphics/services/cg_live_reload'

export interface UpdateAssetInput {
  target: Asset
  file: MultipartFile
}

/** Swaps the file behind the asset: its name, hence its URL in layers, stays the same. */
export default class UpdateAsset {
  async handle(input: UpdateAssetInput): Promise<Asset> {
    input.target.file = await attachmentManager.createFromFile(input.file)
    await input.target.save()
    reloadCgPages()

    return input.target
  }
}
