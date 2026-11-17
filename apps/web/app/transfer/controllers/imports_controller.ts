import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import { withLargeMultipart } from '#common/services/large_multipart'
import { ContextEngineClient } from '#context/services/context_engine_client'
import ImportBundle from '#transfer/actions/import_bundle'
import TransferPolicy from '#transfer/policies/transfer_policy'
import { authorizedSelection } from '#transfer/services/authorized_selection'
import { readBundleManifest } from '#transfer/services/bundle_archive'
import type { TransferBundle } from '#transfer/types/bundle'
import { bundleValidator, importValidator, selectionValidator } from '#transfer/validators/transfer'
import { ASSET_MAX_SIZE } from '#graphics/validators/assets'

@inject()
export default class ImportsController {
  constructor(private engine: ContextEngineClient) {}

  async handle({ bouncer, i18n, request, response, session }: HttpContext) {
    await bouncer.with(TransferPolicy).authorize('manage')

    return withLargeMultipart(request, ASSET_MAX_SIZE, async () => {
      const { file, mode, selection } = await request.validateUsing(importValidator)
      const authorized = await authorizedSelection(
        bouncer,
        await selectionValidator.validate(JSON.parse(selection))
      )

      let content: unknown
      try {
        content = await readBundleManifest(file.tmpPath!)
      } catch {
        session.flash('error', i18n.t('transfer.import.invalid_file'))
        return response.redirect().back()
      }
      const bundle = (await bundleValidator.validate(content)) as TransferBundle

      const report = await new ImportBundle(this.engine).handle({
        bundle,
        archivePath: file.tmpPath!,
        selection: authorized,
        mode,
      })

      session.flash('success', i18n.t('transfer.import.done', report))
      return response.redirect().toRoute('transfer.index')
    })
  }
}
