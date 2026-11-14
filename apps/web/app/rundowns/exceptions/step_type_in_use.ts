import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

export default class StepTypeInUseException extends Exception {
  static status = 409
  static code = 'E_STEP_TYPE_IN_USE'

  constructor() {
    super('This step type is used by at least one step.')
  }

  async handle(error: this, ctx: HttpContext) {
    const message = ctx.i18n?.t('rundowns.step_types.delete.in_use') ?? error.message
    if (ctx.request.accepts(['html', 'json']) === 'json') {
      return ctx.response.status(error.status).send({ message })
    }
    ctx.session?.flash('error', message)
    return ctx.response.redirect().back()
  }
}
