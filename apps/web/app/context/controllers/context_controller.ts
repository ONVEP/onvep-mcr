import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import ContextEngineUnavailableException from '#context/exceptions/context_engine_unavailable_exception'
import ContextPolicy from '#context/policies/context_policy'
import { ContextEngineClient } from '#context/services/context_engine_client'
import type { JsonObject } from '#context/types/engine'

@inject()
export default class ContextController {
  constructor(private engine: ContextEngineClient) {}

  async index({ bouncer, inertia }: HttpContext) {
    await bouncer.with(ContextPolicy).authorize('view')

    let context: JsonObject | null = null
    try {
      context = (await this.engine.getValue('')) as JsonObject
    } catch (error) {
      // Rendering the page (with an error state) beats redirecting back in a loop.
      if (!(error instanceof ContextEngineUnavailableException)) throw error
    }

    return inertia.render('context/explorer', {
      context,
      engineUrl: ContextEngineClient.publicUrl(),
    })
  }
}
