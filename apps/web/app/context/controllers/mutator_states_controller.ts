import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import ContextPolicy from '#context/policies/context_policy'
import { ContextEngineClient } from '#context/services/context_engine_client'
import { stateValidator } from '#context/validators/states'

@inject()
export default class MutatorStatesController {
  constructor(private engine: ContextEngineClient) {}

  async update({ bouncer, params, request, response }: HttpContext) {
    await bouncer.with(ContextPolicy).authorize('manage')

    const { enabled } = await request.validateUsing(stateValidator)
    await this.engine.setMutatorEnabled(params.name, enabled)

    return response.redirect().toRoute('context.mutators.show', { name: params.name })
  }
}
