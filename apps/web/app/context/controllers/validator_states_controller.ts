import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import ContextPolicy from '#context/policies/context_policy'
import { ContextEngineClient } from '#context/services/context_engine_client'
import { stateValidator } from '#context/validators/states'

@inject()
export default class ValidatorStatesController {
  constructor(private engine: ContextEngineClient) {}

  async update({ bouncer, params, request, response }: HttpContext) {
    await bouncer.with(ContextPolicy).authorize('manage')

    const { enabled } = await request.validateUsing(stateValidator)
    // The engine's update replaces the definition: resend it with the new state.
    const { path, schema } = await this.engine.getValidator(params.id)
    await this.engine.updateValidator(params.id, { path, schema, enabled })

    return response.redirect().toRoute('context.validators.show', { id: params.id })
  }
}
