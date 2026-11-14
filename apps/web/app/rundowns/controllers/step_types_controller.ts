import type { HttpContext } from '@adonisjs/core/http'

import CreateStepType from '#rundowns/actions/create_step_type'
import DeleteStepType from '#rundowns/actions/delete_step_type'
import UpdateStepType from '#rundowns/actions/update_step_type'
import StepType from '#rundowns/models/step_type'
import RundownPolicy from '#rundowns/policies/rundown_policy'
import ListStepTypes from '#rundowns/queries/list_step_types'
import StepTypeTransformer from '#rundowns/transformers/step_type_transformer'
import { createStepTypeValidator, editStepTypeValidator } from '#rundowns/validators/step_types'

export default class StepTypesController {
  public async index({ bouncer, inertia }: HttpContext) {
    await bouncer.with(RundownPolicy).authorize('manageStepTypes')

    const stepTypes = await new ListStepTypes().handle()

    return inertia.render('rundowns/step_types/index', {
      stepTypes: StepTypeTransformer.transform(stepTypes).useVariant('forList'),
    })
  }

  public async store({ bouncer, request, response }: HttpContext) {
    await bouncer.with(RundownPolicy).authorize('manageStepTypes')

    const payload = await request.validateUsing(createStepTypeValidator)

    await new CreateStepType().handle(payload)

    return response.redirect().toRoute('step_types.index')
  }

  public async update({ bouncer, params, request, response }: HttpContext) {
    const stepType = await StepType.findOrFail(params.id)

    await bouncer.with(RundownPolicy).authorize('manageStepTypes')

    const payload = await request.validateUsing(editStepTypeValidator, {
      meta: { stepTypeId: stepType.id },
    })

    await new UpdateStepType().handle({ target: stepType, ...payload })

    return response.redirect().toRoute('step_types.index')
  }

  public async destroy({ bouncer, params, response }: HttpContext) {
    const stepType = await StepType.findOrFail(params.id)

    await bouncer.with(RundownPolicy).authorize('manageStepTypes')

    await new DeleteStepType().handle({ target: stepType })

    return response.redirect().toRoute('step_types.index')
  }
}
