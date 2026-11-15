import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import ContextPolicy from '#context/policies/context_policy'
import { ContextEngineClient } from '#context/services/context_engine_client'
import type { JsonSchema } from '#context/types/engine'
import {
  createContextValidatorValidator,
  updateContextValidatorValidator,
} from '#context/validators/context_validators'

@inject()
export default class ValidatorsController {
  constructor(private engine: ContextEngineClient) {}

  async index({ bouncer, inertia, response }: HttpContext) {
    await bouncer.with(ContextPolicy).authorize('manage')

    const validators = await this.engine.listValidators()
    if (validators[0]) {
      return response.redirect().toRoute('context.validators.show', { id: validators[0].id })
    }

    return inertia.render('context/validators', { validators, validator: null })
  }

  async store({ bouncer, request, response }: HttpContext) {
    await bouncer.with(ContextPolicy).authorize('manage')

    const { path } = await request.validateUsing(createContextValidatorValidator)
    // An empty schema accepts anything: the user builds it from there.
    const validator = await this.engine.createValidator({ path: path ?? '', schema: {} })

    return response.redirect().toRoute('context.validators.show', { id: validator.id })
  }

  async show({ bouncer, inertia, params }: HttpContext) {
    await bouncer.with(ContextPolicy).authorize('manage')

    const [validators, validator] = await Promise.all([
      this.engine.listValidators(),
      this.engine.getValidator(params.id),
    ])

    return inertia.render('context/validators', { validators, validator })
  }

  async update({ bouncer, params, request, response }: HttpContext) {
    await bouncer.with(ContextPolicy).authorize('manage')

    const { path, schema } = await request.validateUsing(updateContextValidatorValidator)
    await this.engine.updateValidator(params.id, {
      path: path ?? '',
      schema: JSON.parse(schema) as JsonSchema,
    })

    return response.redirect().toRoute('context.validators.show', { id: params.id })
  }

  async destroy({ bouncer, params, response }: HttpContext) {
    await bouncer.with(ContextPolicy).authorize('manage')

    await this.engine.deleteValidator(params.id)

    return response.redirect().toRoute('context.validators.index')
  }
}
