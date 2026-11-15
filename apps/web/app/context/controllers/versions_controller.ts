import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import ContextPolicy from '#context/policies/context_policy'
import { ContextEngineClient } from '#context/services/context_engine_client'
import {
  listContextVersionsValidator,
  restoreContextVersionValidator,
} from '#context/validators/versions'

const PER_PAGE = 30

@inject()
export default class VersionsController {
  constructor(private engine: ContextEngineClient) {}

  async index({ bouncer, inertia, response }: HttpContext) {
    await bouncer.with(ContextPolicy).authorize('manage')

    const versions = await this.engine.listVersions(1, PER_PAGE)
    if (versions.data[0]) {
      return response.redirect().toRoute('context.versions.show', { id: versions.data[0].id })
    }

    return inertia.render('context/versions', { versions, version: null, latestId: null })
  }

  async show({ bouncer, inertia, params, request }: HttpContext) {
    await bouncer.with(ContextPolicy).authorize('manage')

    const { page = 1 } = await request.validateUsing(listContextVersionsValidator, {
      data: request.qs(),
    })
    const [versions, version, latest] = await Promise.all([
      this.engine.listVersions(page, PER_PAGE),
      this.engine.getVersion(params.id),
      // The live version is the newest one, wherever the list is paginated.
      page === 1 ? null : this.engine.listVersions(1, 1),
    ])

    return inertia.render('context/versions', {
      versions,
      version,
      latestId: (latest ?? versions).data[0]?.id ?? null,
    })
  }

  async restore({ bouncer, i18n, params, request, response, session }: HttpContext) {
    await bouncer.with(ContextPolicy).authorize('manage')

    const { bypassMutators = false } = await request.validateUsing(restoreContextVersionValidator)
    await this.engine.restoreVersion(params.id, bypassMutators)

    session.flash('success', i18n.t('context.versions.restored', { id: params.id }))
    return response.redirect().toRoute('context.versions.index')
  }
}
