import type { HttpContext } from '@adonisjs/core/http'

import CreateAsset from '#graphics/actions/create_asset'
import DeleteAsset from '#graphics/actions/delete_asset'
import UpdateAsset from '#graphics/actions/update_asset'
import Asset from '#graphics/models/asset'
import LayerPolicy from '#graphics/policies/layer_policy'
import ListAssets from '#graphics/queries/list_assets'
import AssetTransformer from '#graphics/transformers/asset_transformer'
import {
  ASSET_MAX_SIZE,
  createAssetValidator,
  updateAssetValidator,
} from '#graphics/validators/assets'
import { withLargeMultipart } from '#common/services/large_multipart'

export default class AssetsController {
  public async index({ bouncer, inertia }: HttpContext) {
    await bouncer.with(LayerPolicy).authorize('manage')

    const assets = await new ListAssets().handle()

    return inertia.render('graphics/assets', {
      assets: AssetTransformer.transform(assets).useVariant('forList'),
    })
  }

  public async store({ bouncer, request, response }: HttpContext) {
    await bouncer.with(LayerPolicy).authorize('manage')

    await withLargeMultipart(request, ASSET_MAX_SIZE, async () => {
      const payload = await request.validateUsing(createAssetValidator)
      await new CreateAsset().handle(payload)
    })

    return response.redirect().toRoute('assets.index')
  }

  public async update({ bouncer, params, request, response }: HttpContext) {
    const asset = await Asset.findOrFail(params.id)

    await bouncer.with(LayerPolicy).authorize('manage')

    await withLargeMultipart(request, ASSET_MAX_SIZE, async () => {
      const payload = await request.validateUsing(updateAssetValidator)
      await new UpdateAsset().handle({ target: asset, ...payload })
    })

    return response.redirect().toRoute('assets.index')
  }

  public async destroy({ bouncer, params, response }: HttpContext) {
    const asset = await Asset.findOrFail(params.id)

    await bouncer.with(LayerPolicy).authorize('manage')

    await new DeleteAsset().handle({ target: asset })

    return response.redirect().toRoute('assets.index')
  }
}
