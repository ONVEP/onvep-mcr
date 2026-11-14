import type { HttpContext } from '@adonisjs/core/http'

import MoveStep from '#rundowns/actions/move_step'
import Rundown from '#rundowns/models/rundown'
import RundownPolicy from '#rundowns/policies/rundown_policy'
import { moveStepValidator } from '#rundowns/validators/steps'

export default class StepMovesController {
  public async handle({ bouncer, params, request, response }: HttpContext) {
    const rundown = await Rundown.findOrFail(params.rundown_id)
    const step = await rundown.related('steps').query().where('id', params.id).firstOrFail()

    await bouncer.with(RundownPolicy).authorize('manage')

    const payload = await request.validateUsing(moveStepValidator)

    await new MoveStep().handle({ target: step, direction: payload.direction })

    return response.redirect().toRoute('rundowns.show', { id: rundown.id })
  }
}
