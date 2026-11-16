import { readFile } from 'node:fs/promises'

import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import { ContextEngineClient } from '#context/services/context_engine_client'
import ImportBundle from '#transfer/actions/import_bundle'
import TransferPolicy from '#transfer/policies/transfer_policy'
import { authorizedSelection } from '#transfer/services/authorized_selection'
import type { TransferBundle } from '#transfer/types/bundle'
import {
  bundleValidator,
  importSelectionValidator,
  importValidator,
} from '#transfer/validators/transfer'

@inject()
export default class ImportsController {
  constructor(private engine: ContextEngineClient) {}

  async handle({ bouncer, i18n, request, response, session }: HttpContext) {
    await bouncer.with(TransferPolicy).authorize('manage')

    const { file, mode, selection } = await request.validateUsing(importValidator)
    const authorized = await authorizedSelection(
      bouncer,
      await importSelectionValidator.validate(JSON.parse(selection))
    )

    let content: unknown
    try {
      content = JSON.parse(await readFile(file.tmpPath!, 'utf8'))
    } catch {
      session.flash('error', i18n.t('transfer.import.invalid_file'))
      return response.redirect().back()
    }
    const bundle = (await bundleValidator.validate(content)) as TransferBundle

    const report = await new ImportBundle(this.engine).handle({
      bundle,
      selection: authorized,
      mode,
    })

    session.flash('success', i18n.t('transfer.import.done', report))
    return response.redirect().toRoute('transfer.index')
  }
}
