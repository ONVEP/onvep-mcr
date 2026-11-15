import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

export default class ValidatorNotFoundException extends Exception {
  static status = 404
  static code = 'E_VALIDATOR_NOT_FOUND'

  constructor(public id: number) {
    super(`Validator ${id} does not exist`)
  }

  async handle(error: this, { response }: HttpContext) {
    response.status(error.status).send({ code: error.code, message: error.message, id: error.id })
  }
}
