import type { ModelPaginatorContract } from '@adonisjs/lucid/types/model'

import NetworkDrive from '#media/models/network_drive'

export interface ListNetworkDrivesFilters {
  q?: string
}

export interface ListNetworkDrivesPagination {
  page: number
  perPage: number
}

export default class ListNetworkDrives {
  async handle(
    filters: ListNetworkDrivesFilters = {},
    pag: ListNetworkDrivesPagination = { page: 1, perPage: 10 }
  ): Promise<ModelPaginatorContract<NetworkDrive>> {
    const query = NetworkDrive.query()

    if (filters.q) {
      const term = `%${filters.q}%`
      query.where((sub) => {
        sub.where('name', 'ilike', term).orWhere('url', 'ilike', term)
      })
    }

    query.orderBy('name', 'asc').orderBy('id', 'asc')

    return query.paginate(pag.page, pag.perPage)
  }
}
