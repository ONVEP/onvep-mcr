import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import ContextPolicy from '#context/policies/context_policy'
import { ContextEngineClient } from '#context/services/context_engine_client'
import type { JsonValue } from '#context/types/engine'
import { contextPathValidator, contextValueValidator } from '#context/validators/values'

/**
 * Writes on the context tree, relayed to the engine. The explorer refreshes
 * from the engine's SSE stream, so the redirect only clears the request.
 */
@inject()
export default class ContextValuesController {
  constructor(private engine: ContextEngineClient) {}

  async update({ bouncer, request, response }: HttpContext) {
    await bouncer.with(ContextPolicy).authorize('edit')
    const { path, value } = await request.validateUsing(contextValueValidator)
    await this.engine.setValue(path ?? '', JSON.parse(value) as JsonValue)
    return response.redirect().back()
  }

  async store({ bouncer, request, response }: HttpContext) {
    await bouncer.with(ContextPolicy).authorize('edit')
    const { path, value } = await request.validateUsing(contextValueValidator)
    await this.engine.appendValue(path ?? '', JSON.parse(value) as JsonValue)
    return response.redirect().back()
  }

  async destroy({ bouncer, request, response }: HttpContext) {
    await bouncer.with(ContextPolicy).authorize('edit')
    const { path } = await request.validateUsing(contextPathValidator)
    await this.engine.removeValue(path)
    return response.redirect().back()
  }
}
