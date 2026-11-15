import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { ContextEngine } from '#context/services/context_engine'
import { listVersionsValidator, restoreVersionValidator } from '#context/validators/context'

@inject()
export default class VersionsController {
  constructor(private engine: ContextEngine) {}

  async index({ request }: HttpContext) {
    const { page = 1, perPage = 20 } = await request.validateUsing(listVersionsValidator, {
      data: request.qs(),
    })
    const versions = await this.engine.listVersions(page, perPage)
    versions.baseUrl('/versions')
    return {
      meta: versions.getMeta(),
      data: versions.all().map(({ id, createdAt }) => ({ id, createdAt })),
    }
  }

  async show({ params }: HttpContext) {
    const { id, createdAt, context } = await this.engine.findVersion(params.id)
    return { id, createdAt, context }
  }

  async restore({ params, request }: HttpContext) {
    const { bypassMutators } = await request.validateUsing(restoreVersionValidator)
    return this.engine.restore(params.id, { bypassMutators })
  }
}
