import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import type ContextValidator from '#context/models/context_validator'
import type { JsonObject } from '#context/lib/path'
import { ContextEngine } from '#context/services/context_engine'
import { validatorDefinitionValidator } from '#context/validators/context'

function serialize({ id, path, schema, enabled, createdAt, updatedAt }: ContextValidator) {
  return { id, path, schema, enabled, createdAt, updatedAt }
}

@inject()
export default class ValidatorsController {
  constructor(private engine: ContextEngine) {}

  async index() {
    const validators = await this.engine.validators.list()
    return validators.map(serialize)
  }

  async show({ params }: HttpContext) {
    return serialize(await this.engine.validators.find(params.id))
  }

  async store({ request, response }: HttpContext) {
    const { path, schema, enabled } = await request.validateUsing(validatorDefinitionValidator)
    const validator = await this.engine.validators.create({
      path,
      schema: schema as JsonObject,
      enabled,
    })
    return response.created(serialize(validator))
  }

  async update({ params, request }: HttpContext) {
    const { path, schema, enabled } = await request.validateUsing(validatorDefinitionValidator)
    const validator = await this.engine.validators.update(params.id, {
      path,
      schema: schema as JsonObject,
      enabled,
    })
    return serialize(validator)
  }

  async destroy({ params, response }: HttpContext) {
    await this.engine.validators.delete(params.id)
    return response.noContent()
  }
}
