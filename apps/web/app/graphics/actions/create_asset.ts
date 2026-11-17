import type { MultipartFile } from '@adonisjs/core/types/bodyparser'
import { attachmentManager } from '@jrmc/adonis-attachment'

import Asset from '#graphics/models/asset'
import { uniqueAssetName } from '#graphics/services/unique_asset_name'

export interface CreateAssetInput {
  file: MultipartFile
}

export default class CreateAsset {
  async handle(input: CreateAssetInput): Promise<Asset> {
    return Asset.create({
      name: await uniqueAssetName(input.file.clientName),
      file: await attachmentManager.createFromFile(input.file),
    })
  }
}
