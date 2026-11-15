import type { HttpContext } from '@adonisjs/core/http'

import UpdateCustomCss from '#graphics/actions/update_custom_css'
import LayerPolicy from '#graphics/policies/layer_policy'
import { updateCustomCssValidator } from '#graphics/validators/custom_css'

export default class CustomCssController {
  public async update({ bouncer, request, response }: HttpContext) {
    await bouncer.with(LayerPolicy).authorize('manage')

    const payload = await request.validateUsing(updateCustomCssValidator)

    await new UpdateCustomCss().handle(payload)

    return response.redirect().toRoute('css_variables.index')
  }
}
