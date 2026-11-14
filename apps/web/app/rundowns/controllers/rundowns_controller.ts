import type { HttpContext } from '@adonisjs/core/http'

import CreateRundown from '#rundowns/actions/create_rundown'
import DeleteRundown from '#rundowns/actions/delete_rundown'
import UpdateRundown from '#rundowns/actions/update_rundown'
import Rundown from '#rundowns/models/rundown'
import RundownPolicy from '#rundowns/policies/rundown_policy'
import GetRundownSteps from '#rundowns/queries/get_rundown_steps'
import ListRundowns from '#rundowns/queries/list_rundowns'
import ListStepTypes from '#rundowns/queries/list_step_types'
import RundownTransformer from '#rundowns/transformers/rundown_transformer'
import StepTransformer from '#rundowns/transformers/step_transformer'
import StepTypeTransformer from '#rundowns/transformers/step_type_transformer'
import { rundownValidator } from '#rundowns/validators/rundowns'

export default class RundownsController {
  public async index({ bouncer, inertia }: HttpContext) {
    await bouncer.with(RundownPolicy).authorize('viewList')

    const rundowns = await new ListRundowns().handle()

    return inertia.render('rundowns/index', {
      rundowns: RundownTransformer.transform(rundowns).useVariant('forList'),
    })
  }

  public async create({ bouncer, inertia }: HttpContext) {
    await bouncer.with(RundownPolicy).authorize('manage')

    return inertia.modal('rundowns/create', {}, { route: 'rundowns.index' })
  }

  public async store({ bouncer, request, response }: HttpContext) {
    await bouncer.with(RundownPolicy).authorize('manage')

    const payload = await request.validateUsing(rundownValidator)

    const rundown = await new CreateRundown().handle(payload)

    return response.redirect().toRoute('rundowns.show', { id: rundown.id })
  }

  public async show({ bouncer, inertia, params }: HttpContext) {
    const rundown = await Rundown.findOrFail(params.id)

    await bouncer.with(RundownPolicy).authorize('view')

    const steps = await new GetRundownSteps().handle(rundown)
    const stepTypes = await new ListStepTypes().handle()

    return inertia.render('rundowns/show', {
      rundown: RundownTransformer.transform(rundown).useVariant('forShow'),
      steps: StepTransformer.transform(steps).useVariant('forTimeline'),
      stepTypes: StepTypeTransformer.transform(stepTypes).useVariant('forOption'),
    })
  }

  public async edit({ bouncer, inertia, params }: HttpContext) {
    const rundown = await Rundown.findOrFail(params.id)

    await bouncer.with(RundownPolicy).authorize('manage')

    return inertia.modal(
      'rundowns/edit',
      { rundown: RundownTransformer.transform(rundown).useVariant('forEdit') },
      { route: 'rundowns.show', params: { id: rundown.id } }
    )
  }

  public async update({ bouncer, params, request, response }: HttpContext) {
    const rundown = await Rundown.findOrFail(params.id)

    await bouncer.with(RundownPolicy).authorize('manage')

    const payload = await request.validateUsing(rundownValidator)

    await new UpdateRundown().handle({ target: rundown, ...payload })

    return response.redirect().toRoute('rundowns.show', { id: rundown.id })
  }

  public async destroy({ bouncer, params, response }: HttpContext) {
    const rundown = await Rundown.findOrFail(params.id)

    await bouncer.with(RundownPolicy).authorize('manage')

    await new DeleteRundown().handle({ target: rundown })

    return response.redirect().toRoute('rundowns.index')
  }
}
