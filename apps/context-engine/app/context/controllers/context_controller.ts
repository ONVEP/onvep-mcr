import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import PathNotFoundException from '#context/exceptions/path_not_found_exception'
import { ContextEngine } from '#context/services/context_engine'
import { contextValueValidator } from '#context/validators/context'

@inject()
export default class ContextController {
  constructor(private engine: ContextEngine) {}

  async show({ params }: HttpContext) {
    const path = params.path ?? ''
    const value = this.engine.get(path)
    if (value === undefined) throw new PathNotFoundException(path)
    return { path, value }
  }

  async update({ params, request }: HttpContext) {
    const { value } = await request.validateUsing(contextValueValidator)
    return this.engine.set(params.path ?? '', value)
  }

  async merge({ params, request }: HttpContext) {
    const { value } = await request.validateUsing(contextValueValidator)
    return this.engine.merge(params.path ?? '', value)
  }

  async append({ params, request }: HttpContext) {
    const { value } = await request.validateUsing(contextValueValidator)
    return this.engine.append(params.path ?? '', value)
  }

  async destroy({ params }: HttpContext) {
    return this.engine.remove(params.path ?? '')
  }
}
