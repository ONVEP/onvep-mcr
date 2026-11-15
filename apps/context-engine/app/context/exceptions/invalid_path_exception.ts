import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

export default class InvalidPathException extends Exception {
  static status = 400
  static code = 'E_INVALID_PATH'

  async handle(error: this, { response }: HttpContext) {
    response.status(error.status).send({ code: error.code, message: error.message })
  }
}
