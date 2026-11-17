import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import { ContextEngineClient } from '#context/services/context_engine_client'
import TransferPolicy from '#transfer/policies/transfer_policy'
import ExportBundleQuery from '#transfer/queries/export_bundle'
import { authorizedSelection } from '#transfer/services/authorized_selection'
import { packBundle } from '#transfer/services/bundle_archive'
import { exportValidator, selectionValidator } from '#transfer/validators/transfer'

@inject()
export default class ExportsController {
  constructor(private engine: ContextEngineClient) {}

  async handle({ bouncer, request, response }: HttpContext) {
    await bouncer.with(TransferPolicy).authorize('manage')

    const { selection } = await request.validateUsing(exportValidator)
    const authorized = await authorizedSelection(
      bouncer,
      await selectionValidator.validate(JSON.parse(selection))
    )
    const bundle = await new ExportBundleQuery(this.engine).handle(authorized)

    const date = bundle.exportedAt.slice(0, 10)
    response.header('content-type', 'application/x-tar')
    response.header('content-disposition', `attachment; filename="onvep-mcr-${date}.tar"`)
    return response.stream(packBundle(bundle))
  }
}
