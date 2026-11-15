import { createRequire } from 'node:module'

import type { HttpContext } from '@adonisjs/core/http'

import Layer from '#graphics/models/layer'
import ListCssVariables from '#graphics/queries/list_css_variables'
import ListLayers from '#graphics/queries/list_layers'

const require = createRequire(import.meta.url)
const TAILWIND_BROWSER = require.resolve('@tailwindcss/browser')
const TRANSMIT_CLIENT = require.resolve('@adonisjs/transmit-client')

/**
 * Public pages loaded by playout software (CasparCG, OBS browser source…), which can't log in.
 */
export default class CgController {
  // Rendered even when disabled: `enabled` only drives /cg/all.
  public async layer({ params, view }: HttpContext) {
    const layer = await Layer.findByOrFail('slug', params.slug)
    const cssVariables = await new ListCssVariables().handle()

    return view.render('graphics::views/cg', {
      title: layer.name,
      layers: [layer],
      cssVariables,
      liveReload: { slug: layer.slug },
    })
  }

  public async all({ view }: HttpContext) {
    const layers = await new ListLayers().handle({ enabledOnly: true })
    const cssVariables = await new ListCssVariables().handle()

    return view.render('graphics::views/cg', {
      title: 'CG',
      layers,
      cssVariables,
      liveReload: { slug: null },
    })
  }

  public async tailwind({ response }: HttpContext) {
    response.header('Cache-Control', 'public, max-age=86400')
    return response.download(TAILWIND_BROWSER)
  }

  public async transmit({ response }: HttpContext) {
    response.header('Cache-Control', 'public, max-age=86400')
    response.header('Content-Type', 'text/javascript; charset=utf-8')
    return response.download(TRANSMIT_CLIENT)
  }
}
