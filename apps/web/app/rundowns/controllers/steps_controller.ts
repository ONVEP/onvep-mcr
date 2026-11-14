import type { HttpContext } from '@adonisjs/core/http'

import CreateStep from '#rundowns/actions/create_step'
import DeleteStep from '#rundowns/actions/delete_step'
import UpdateStep from '#rundowns/actions/update_step'
import Rundown from '#rundowns/models/rundown'
import RundownPolicy from '#rundowns/policies/rundown_policy'
import { stepValidator } from '#rundowns/validators/steps'

export default class StepsController {
  public async store({ bouncer, params, request, response }: HttpContext) {
    const rundown = await Rundown.findOrFail(params.rundown_id)

    await bouncer.with(RundownPolicy).authorize('manage')

    const payload = await request.validateUsing(stepValidator)

    await new CreateStep().handle({ rundown, ...payload })

    return response.redirect().toRoute('rundowns.show', { id: rundown.id })
  }

  public async update({ bouncer, params, request, response }: HttpContext) {
    const rundown = await Rundown.findOrFail(params.rundown_id)
    const step = await rundown.related('steps').query().where('id', params.id).firstOrFail()

    await bouncer.with(RundownPolicy).authorize('manage')

    const payload = await request.validateUsing(stepValidator)

    await new UpdateStep().handle({ target: step, ...payload })

    return response.redirect().toRoute('rundowns.show', { id: rundown.id })
  }

  public async destroy({ bouncer, params, response }: HttpContext) {
    const rundown = await Rundown.findOrFail(params.rundown_id)
    const step = await rundown.related('steps').query().where('id', params.id).firstOrFail()

    await bouncer.with(RundownPolicy).authorize('manage')

    await new DeleteStep().handle({ target: step })

    return response.redirect().toRoute('rundowns.show', { id: rundown.id })
  }
}
