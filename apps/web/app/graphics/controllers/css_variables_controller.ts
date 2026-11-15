import type { HttpContext } from '@adonisjs/core/http'

import CreateCssVariable from '#graphics/actions/create_css_variable'
import DeleteCssVariable from '#graphics/actions/delete_css_variable'
import UpdateCssVariable from '#graphics/actions/update_css_variable'
import CssVariable from '#graphics/models/css_variable'
import LayerPolicy from '#graphics/policies/layer_policy'
import GetCustomCss from '#graphics/queries/get_custom_css'
import ListCssVariables from '#graphics/queries/list_css_variables'
import CssVariableTransformer from '#graphics/transformers/css_variable_transformer'
import {
  createCssVariableValidator,
  editCssVariableValidator,
} from '#graphics/validators/css_variables'

export default class CssVariablesController {
  public async index({ bouncer, inertia }: HttpContext) {
    await bouncer.with(LayerPolicy).authorize('manage')

    const cssVariables = await new ListCssVariables().handle()

    return inertia.render('graphics/css_variables', {
      cssVariables: CssVariableTransformer.transform(cssVariables).useVariant('forList'),
      customCss: await new GetCustomCss().handle(),
    })
  }

  public async store({ bouncer, request, response }: HttpContext) {
    await bouncer.with(LayerPolicy).authorize('manage')

    const payload = await request.validateUsing(createCssVariableValidator)

    await new CreateCssVariable().handle(payload)

    return response.redirect().toRoute('css_variables.index')
  }

  public async update({ bouncer, params, request, response }: HttpContext) {
    const cssVariable = await CssVariable.findOrFail(params.id)

    await bouncer.with(LayerPolicy).authorize('manage')

    const payload = await request.validateUsing(editCssVariableValidator, {
      meta: { cssVariableId: cssVariable.id },
    })

    await new UpdateCssVariable().handle({ target: cssVariable, ...payload })

    return response.redirect().toRoute('css_variables.index')
  }

  public async destroy({ bouncer, params, response }: HttpContext) {
    const cssVariable = await CssVariable.findOrFail(params.id)

    await bouncer.with(LayerPolicy).authorize('manage')

    await new DeleteCssVariable().handle({ target: cssVariable })

    return response.redirect().toRoute('css_variables.index')
  }
}
