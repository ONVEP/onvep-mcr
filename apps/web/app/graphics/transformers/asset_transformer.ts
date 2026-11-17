import { BaseTransformer } from '@adonisjs/core/transformers'

import type Asset from '#graphics/models/asset'

export default class AssetTransformer extends BaseTransformer<Asset> {
  toObject() {
    return {
      id: this.resource.id,
      name: this.resource.name,
      url: `/cg/files/${this.resource.name}`,
      mimeType: this.resource.file.mimeType,
      size: this.resource.file.size,
    }
  }

  forList() {
    return this.toObject()
  }
}
