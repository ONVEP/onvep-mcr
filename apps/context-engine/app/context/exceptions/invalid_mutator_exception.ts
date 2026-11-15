import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * A mutator doesn't match the expected module shape. 500 when found broken
 * on the disk, 422 when rejected on write.
 */
export default class InvalidMutatorException extends Exception {
  static status = 500
  static code = 'E_INVALID_MUTATOR'

  async handle(error: this, { response }: HttpContext) {
    response.status(error.status).send({ code: error.code, message: error.message })
  }
}
