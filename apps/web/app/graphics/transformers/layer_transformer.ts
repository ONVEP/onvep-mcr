import { BaseTransformer } from '@adonisjs/core/transformers'

import type Layer from '#graphics/models/layer'

export default class LayerTransformer extends BaseTransformer<Layer> {
  toObject() {
    return {
      id: this.resource.id,
      name: this.resource.name,
      slug: this.resource.slug,
      enabled: this.resource.enabled,
    }
  }

  forList() {
    return this.toObject()
  }

  forEdit() {
    return {
      ...this.toObject(),
      content: this.resource.content,
    }
  }
}
