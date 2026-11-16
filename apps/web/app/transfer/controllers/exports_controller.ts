import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import { ContextEngineClient } from '#context/services/context_engine_client'
import TransferPolicy from '#transfer/policies/transfer_policy'
import ExportBundleQuery from '#transfer/queries/export_bundle'
import { authorizedSelection } from '#transfer/services/authorized_selection'
import { exportValidator } from '#transfer/validators/transfer'

@inject()
export default class ExportsController {
  constructor(private engine: ContextEngineClient) {}

  // Fetched by the page and saved as a file: a plain JSON download, not an Inertia visit.
  async handle({ bouncer, request, response }: HttpContext) {
    await bouncer.with(TransferPolicy).authorize('manage')

    const selection = await authorizedSelection(
      bouncer,
      await request.validateUsing(exportValidator)
    )
    const bundle = await new ExportBundleQuery(this.engine).handle(selection)

    const date = bundle.exportedAt.slice(0, 10)
    response.header('content-disposition', `attachment; filename="onvep-mcr-${date}.json"`)
    return response.json(bundle)
  }
}
