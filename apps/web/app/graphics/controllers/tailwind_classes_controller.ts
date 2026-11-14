import type { HttpContext } from '@adonisjs/core/http'

import LayerPolicy from '#graphics/policies/layer_policy'
import { tailwindClassList } from '#graphics/services/tailwind_class_list'

export default class TailwindClassesController {
  public async handle({ bouncer, response }: HttpContext) {
    await bouncer.with(LayerPolicy).authorize('manage')

    // Only changes with the Tailwind version, i.e. on deploy.
    response.header('Cache-Control', 'private, max-age=3600')
    return tailwindClassList()
  }
}
