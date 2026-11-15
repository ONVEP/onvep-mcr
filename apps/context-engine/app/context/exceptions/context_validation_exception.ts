import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

export type ContextValidationError = {
  /** Concrete context path the validator ran on */
  path: string
  /** Field inside the validated value, as reported by VineJS */
  field: string
  message: string
  rule: string
}

export default class ContextValidationException extends Exception {
  static status = 422
  static code = 'E_CONTEXT_VALIDATION'

  constructor(public errors: ContextValidationError[]) {
    super('The updated context does not satisfy its validators')
  }

  async handle(error: this, { response }: HttpContext) {
    response
      .status(error.status)
      .send({ code: error.code, message: error.message, errors: error.errors })
  }
}
