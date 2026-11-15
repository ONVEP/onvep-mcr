import type { HttpContext } from '@adonisjs/core/http'

import CreateLayer from '#graphics/actions/create_layer'
import DeleteLayer from '#graphics/actions/delete_layer'
import UpdateLayer from '#graphics/actions/update_layer'
import Layer from '#graphics/models/layer'
import LayerPolicy from '#graphics/policies/layer_policy'
import GetCustomCss from '#graphics/queries/get_custom_css'
import ListCssVariables from '#graphics/queries/list_css_variables'
import ListLayers from '#graphics/queries/list_layers'
import LayerTransformer from '#graphics/transformers/layer_transformer'
import { createLayerValidator, updateLayerValidator } from '#graphics/validators/layers'

// Marker swapped client-side for the editor content, so the preview uses the exact CG shell.
const PREVIEW_PLACEHOLDER = '<!--cg-preview-content-->'

export default class LayersController {
  public async index({ bouncer, inertia, response }: HttpContext) {
    await bouncer.with(LayerPolicy).authorize('manage')

    const layers = await new ListLayers().handle()
    if (layers[0]) return response.redirect().toRoute('layers.show', { id: layers[0].id })

    return inertia.render('graphics/editor', {
      layers: [],
      layer: null,
      previewShell: '',
      previewPlaceholder: PREVIEW_PLACEHOLDER,
    })
  }

  public async store({ bouncer, request, response }: HttpContext) {
    await bouncer.with(LayerPolicy).authorize('manage')

    const payload = await request.validateUsing(createLayerValidator)

    const layer = await new CreateLayer().handle(payload)

    return response.redirect().toRoute('layers.show', { id: layer.id })
  }

  public async show({ bouncer, inertia, params, view }: HttpContext) {
    const layer = await Layer.findOrFail(params.id)

    await bouncer.with(LayerPolicy).authorize('manage')

    const layers = await new ListLayers().handle()
    const previewShell = await view.render('graphics::views/cg', {
      title: layer.name,
      layers: [{ slug: layer.slug, content: PREVIEW_PLACEHOLDER }],
      cssVariables: await new ListCssVariables().handle(),
      customCss: await new GetCustomCss().handle(),
    })

    return inertia.render('graphics/editor', {
      layers: LayerTransformer.transform(layers).useVariant('forList'),
      layer: LayerTransformer.transform(layer).useVariant('forEdit'),
      previewShell,
      previewPlaceholder: PREVIEW_PLACEHOLDER,
    })
  }

  public async update({ bouncer, params, request, response }: HttpContext) {
    const layer = await Layer.findOrFail(params.id)

    await bouncer.with(LayerPolicy).authorize('manage')

    const payload = await request.validateUsing(updateLayerValidator)

    await new UpdateLayer().handle({ target: layer, ...payload })

    return response.redirect().toRoute('layers.show', { id: layer.id })
  }

  public async destroy({ bouncer, params, response }: HttpContext) {
    const layer = await Layer.findOrFail(params.id)

    await bouncer.with(LayerPolicy).authorize('manage')

    await new DeleteLayer().handle({ target: layer })

    return response.redirect().toRoute('layers.index')
  }
}
