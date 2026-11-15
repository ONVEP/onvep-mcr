import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * A validator definition is rejected: unparsable path, invalid JSON Schema
 * or a path that already has a validator.
 */
export default class InvalidValidatorException extends Exception {
  static status = 422
  static code = 'E_INVALID_VALIDATOR'

  async handle(error: this, { response }: HttpContext) {
    response.status(error.status).send({ code: error.code, message: error.message })
  }
}
