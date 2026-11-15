import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

export default class PathNotFoundException extends Exception {
  static status = 404
  static code = 'E_PATH_NOT_FOUND'

  constructor(public path: string) {
    super(`Nothing exists at path "${path}"`)
  }

  async handle(error: this, { response }: HttpContext) {
    response
      .status(error.status)
      .send({ code: error.code, message: error.message, path: error.path })
  }
}
