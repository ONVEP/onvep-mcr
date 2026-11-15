import { createRequire } from 'node:module'

import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'

import Layer from '#graphics/models/layer'
import GetCustomCss from '#graphics/queries/get_custom_css'
import ListCssVariables from '#graphics/queries/list_css_variables'
import ListLayers from '#graphics/queries/list_layers'
import { contextEngineUrl } from '#graphics/services/context_engine_url'

const require = createRequire(import.meta.url)
const TAILWIND_BROWSER = require.resolve('@tailwindcss/browser')
const TRANSMIT_CLIENT = require.resolve('@adonisjs/transmit-client')
const CTX_RUNTIME = app.makePath('app/graphics/resources/cg/ctx.js')

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
      customCss: await new GetCustomCss().handle(),
      contextEngineUrl: contextEngineUrl(),
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
      customCss: await new GetCustomCss().handle(),
      contextEngineUrl: contextEngineUrl(),
      liveReload: { slug: null },
    })
  }

  public async tailwind({ response }: HttpContext) {
    response.header('Cache-Control', 'public, max-age=86400')
    return response.download(TAILWIND_BROWSER)
  }

  public async transmit({ response }: HttpContext) {
    return this.#serveModule(response, TRANSMIT_CLIENT)
  }

  public async ctx({ response }: HttpContext) {
    return this.#serveModule(response, CTX_RUNTIME)
  }

  // ES modules are fetched in CORS mode, and the editor preview is a sandboxed (opaque origin) iframe.
  #serveModule(response: HttpContext['response'], path: string) {
    response.header('Cache-Control', 'no-cache')
    response.header('Content-Type', 'text/javascript; charset=utf-8')
    response.header('Access-Control-Allow-Origin', '*')
    return response.download(path)
  }
}
