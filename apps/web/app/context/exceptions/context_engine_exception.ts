import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

type EngineErrorBody = {
  code?: string
  message?: string
  errors?: { path: string; field: string; message: string }[]
}

/**
 * The context engine refused a request (validation, mutator failure, unknown
 * path…). Its message is relayed to the user as a toast.
 */
export default class ContextEngineException extends Exception {
  static code = 'E_CONTEXT_ENGINE'

  constructor(
    status: number,
    public body: EngineErrorBody | null
  ) {
    super(body?.message ?? `Context engine responded with status ${status}`, { status })
  }

  /** Validation failures carry one entry per field: surface them in the toast. */
  get details() {
    const errors = this.body?.errors ?? []
    return errors.map(({ path, field, message }) => {
      const location = [path, field].filter(Boolean).join('.')
      return location ? `${location}: ${message}` : message
    })
  }

  async handle(error: this, ctx: HttpContext) {
    const details = error.details.join(' — ')
    const message = details ? `${error.message} (${details})` : error.message
    if (ctx.request.accepts(['html', 'json']) === 'json') {
      return ctx.response.status(error.status).send({ message, ...error.body })
    }
    ctx.session?.flash('error', message)
    return ctx.response.redirect().back()
  }
}
