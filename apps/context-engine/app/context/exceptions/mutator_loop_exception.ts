import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * Mutators kept re-triggering each other. The update is rolled back.
 */
export default class MutatorLoopException extends Exception {
  static status = 422
  static code = 'E_MUTATOR_LOOP'

  constructor(
    public mutators: string[],
    maxPasses: number
  ) {
    super(
      `Mutators are still re-triggering each other after ${maxPasses} passes: ${mutators.join(', ')}`
    )
  }

  async handle(error: this, { response }: HttpContext) {
    response
      .status(error.status)
      .send({ code: error.code, message: error.message, mutators: error.mutators })
  }
}
