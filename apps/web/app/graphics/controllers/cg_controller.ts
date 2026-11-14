import { createRequire } from 'node:module'

import type { HttpContext } from '@adonisjs/core/http'

import Layer from '#graphics/models/layer'
import ListLayers from '#graphics/queries/list_layers'

const TAILWIND_BROWSER = createRequire(import.meta.url).resolve('@tailwindcss/browser')

/**
 * Public pages loaded by playout software (CasparCG, OBS browser source…), which can't log in.
 */
export default class CgController {
  // Rendered even when disabled: `enabled` only drives /cg/all.
  public async layer({ params, view }: HttpContext) {
    const layer = await Layer.findByOrFail('slug', params.slug)

    return view.render('graphics::views/cg', { title: layer.name, layers: [layer] })
  }

  public async all({ view }: HttpContext) {
    const layers = await new ListLayers().handle({ enabledOnly: true })

    return view.render('graphics::views/cg', { title: 'CG', layers })
  }

  public async tailwind({ response }: HttpContext) {
    response.header('Cache-Control', 'public, max-age=86400')
    return response.download(TAILWIND_BROWSER)
  }
}
