import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

export default class MutatorNotFoundException extends Exception {
  static status = 404
  static code = 'E_MUTATOR_NOT_FOUND'

  constructor(public mutator: string) {
    super(`Mutator "${mutator}" does not exist`)
  }

  async handle(error: this, { response }: HttpContext) {
    response
      .status(error.status)
      .send({ code: error.code, message: error.message, mutator: error.mutator })
  }
}
