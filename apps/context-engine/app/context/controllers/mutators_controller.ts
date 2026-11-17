import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { ContextEngine } from '#context/services/context_engine'
import { enabledValidator, mutatorSourceValidator } from '#context/validators/context'

/**
 * Mutator files are addressed by their disk key, which may contain slashes:
 * routes use a wildcard and rebuild the name from its segments.
 */
function mutatorName(params: Record<string, any>) {
  return (params['*'] as string[]).join('/')
}

@inject()
export default class MutatorsController {
  constructor(private engine: ContextEngine) {}

  async index() {
    return this.engine.listMutators()
  }

  async show({ params }: HttpContext) {
    const name = mutatorName(params)
    const source = await this.engine.mutators.read(name)
    const loaded = this.engine.mutators.all().find((mutator) => mutator.name === name)
    return {
      name,
      subscriptions: loaded?.subscriptions ?? [],
      enabled: loaded?.enabled ?? true,
      source,
    }
  }

  async update({ params, request }: HttpContext) {
    const { source } = await request.validateUsing(mutatorSourceValidator)
    await this.engine.mutators.write(mutatorName(params), source)
    return this.engine.listMutators()
  }

  async toggle({ params, request }: HttpContext) {
    const { enabled } = await request.validateUsing(enabledValidator)
    await this.engine.mutators.setEnabled(mutatorName(params), enabled)
    return this.engine.listMutators()
  }

  async destroy({ params }: HttpContext) {
    await this.engine.mutators.remove(mutatorName(params))
    return this.engine.listMutators()
  }

  async reload() {
    return this.engine.reloadMutators()
  }
}
