import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * A mutator threw or returned an invalid context. The update is rolled back.
 */
export default class MutatorException extends Exception {
  static status = 422
  static code = 'E_MUTATOR_FAILED'

  constructor(
    public mutator: string,
    reason: string,
    options?: ErrorOptions
  ) {
    super(`Mutator "${mutator}" rejected the update: ${reason}`, options)
  }

  async handle(error: this, { response }: HttpContext) {
    response
      .status(error.status)
      .send({ code: error.code, message: error.message, mutator: error.mutator })
  }
}
