import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import ContextPolicy from '#context/policies/context_policy'
import { ContextEngineClient } from '#context/services/context_engine_client'

@inject()
export default class MutatorRunsController {
  constructor(private engine: ContextEngineClient) {}

  async store({ bouncer, i18n, params, response, session }: HttpContext) {
    await bouncer.with(ContextPolicy).authorize('manage')

    const { changes } = await this.engine.runMutator(params.name)

    session.flash('success', i18n.t('context.mutators.ran', { count: changes.length }))
    return response.redirect().toRoute('context.mutators.show', { name: params.name })
  }
}
