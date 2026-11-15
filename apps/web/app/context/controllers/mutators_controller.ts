import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import ContextPolicy from '#context/policies/context_policy'
import { ContextEngineClient } from '#context/services/context_engine_client'
import { createMutatorValidator, updateMutatorValidator } from '#context/validators/mutators'

const NEW_MUTATOR_SOURCE = `// Runs when one of these context paths changes ("*" matches any key or index).
export const subscriptions = []

/**
 * @param oldContext the committed context (read-only)
 * @param newContext the context being updated
 * @returns the context to commit
 */
export default function (oldContext, newContext) {
  return newContext
}
`

@inject()
export default class MutatorsController {
  constructor(private engine: ContextEngineClient) {}

  async index({ bouncer, inertia, response }: HttpContext) {
    await bouncer.with(ContextPolicy).authorize('manage')

    const mutators = await this.engine.listMutators()
    if (mutators[0]) {
      return response.redirect().toRoute('context.mutators.show', { name: mutators[0].name })
    }

    return inertia.render('context/mutators', { mutators, mutator: null })
  }

  async store({ bouncer, request, response }: HttpContext) {
    await bouncer.with(ContextPolicy).authorize('manage')

    const payload = await request.validateUsing(createMutatorValidator)
    const name = /\.m?js$/.test(payload.name) ? payload.name : `${payload.name}.js`

    await this.engine.saveMutator(name, NEW_MUTATOR_SOURCE)

    return response.redirect().toRoute('context.mutators.show', { name })
  }

  async show({ bouncer, inertia, params }: HttpContext) {
    await bouncer.with(ContextPolicy).authorize('manage')

    const [mutators, mutator] = await Promise.all([
      this.engine.listMutators(),
      this.engine.getMutator(params.name),
    ])

    return inertia.render('context/mutators', { mutators, mutator })
  }

  async update({ bouncer, params, request, response }: HttpContext) {
    await bouncer.with(ContextPolicy).authorize('manage')

    const { source } = await request.validateUsing(updateMutatorValidator)
    await this.engine.saveMutator(params.name, source ?? '')

    return response.redirect().toRoute('context.mutators.show', { name: params.name })
  }

  async destroy({ bouncer, params, response }: HttpContext) {
    await bouncer.with(ContextPolicy).authorize('manage')

    await this.engine.deleteMutator(params.name)

    return response.redirect().toRoute('context.mutators.index')
  }
}
