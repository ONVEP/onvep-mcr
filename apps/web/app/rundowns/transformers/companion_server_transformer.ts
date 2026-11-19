import { BaseTransformer } from '@adonisjs/core/transformers'

import type CompanionServer from '#rundowns/models/companion_server'

export default class CompanionServerTransformer extends BaseTransformer<CompanionServer> {
  toObject() {
    return {
      id: this.resource.id,
      name: this.resource.name,
      url: this.resource.url,
      technicalPages: this.resource.technicalPages,
    }
  }

  forList() {
    return this.toObject()
  }

  forShow() {
    return this.toObject()
  }
}
