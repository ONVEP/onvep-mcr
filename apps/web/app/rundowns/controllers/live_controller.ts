import type { HttpContext } from '@adonisjs/core/http'

import LivePolicy from '#rundowns/policies/live_policy'

export default class LiveController {
  public async handle({ bouncer, inertia }: HttpContext) {
    await bouncer.with(LivePolicy).authorize('view')

    return inertia.render('rundowns/live', {})
  }
}
