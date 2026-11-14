import { BaseTransformer } from '@adonisjs/core/transformers'

import type NetworkDrive from '#media/models/network_drive'

// The password never leaves the server.
export default class NetworkDriveTransformer extends BaseTransformer<NetworkDrive> {
  toObject() {
    return {
      id: this.resource.id,
      name: this.resource.name,
      url: this.resource.url,
      username: this.resource.username,
    }
  }

  forList() {
    return {
      ...this.toObject(),
      createdAt: this.resource.createdAt.toISO()!,
    }
  }

  forEdit() {
    return this.toObject()
  }
}
