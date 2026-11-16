import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import { ContextEngineClient } from '#context/services/context_engine_client'
import TransferPolicy from '#transfer/policies/transfer_policy'
import TransferInventoryQuery from '#transfer/queries/transfer_inventory'
import { allowedNodes } from '#transfer/services/authorized_selection'

@inject()
export default class TransferController {
  constructor(private engine: ContextEngineClient) {}

  async index({ bouncer, inertia }: HttpContext) {
    await bouncer.with(TransferPolicy).authorize('manage')

    const nodes = await allowedNodes(bouncer)
    const inventory = await new TransferInventoryQuery(this.engine).handle(nodes)

    return inertia.render('transfer/index', { nodes, inventory })
  }
}
