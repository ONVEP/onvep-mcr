import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

export default class ContextEngineUnavailableException extends Exception {
  static status = 503
  static code = 'E_CONTEXT_ENGINE_UNAVAILABLE'

  async handle(error: this, ctx: HttpContext) {
    const message = ctx.i18n?.t('context.errors.unavailable') ?? error.message
    if (ctx.request.accepts(['html', 'json']) === 'json') {
      return ctx.response.status(error.status).send({ message })
    }
    ctx.session?.flash('error', message)
    return ctx.response.redirect().back()
  }
}
