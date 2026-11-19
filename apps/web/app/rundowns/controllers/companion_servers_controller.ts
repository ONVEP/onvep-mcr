import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import CreateCompanionServer from '#rundowns/actions/create_companion_server'
import DeleteCompanionServer from '#rundowns/actions/delete_companion_server'
import UpdateCompanionServer from '#rundowns/actions/update_companion_server'
import CompanionServer from '#rundowns/models/companion_server'
import RundownPolicy from '#rundowns/policies/rundown_policy'
import ListCompanionServers from '#rundowns/queries/list_companion_servers'
import { CompanionLive, companionChannel } from '#rundowns/services/companion_live'
import CompanionServerTransformer from '#rundowns/transformers/companion_server_transformer'
import {
  createCompanionServerValidator,
  editCompanionServerValidator,
} from '#rundowns/validators/companion_servers'

@inject()
export default class CompanionServersController {
  constructor(private live: CompanionLive) {}

  public async index({ bouncer, inertia }: HttpContext) {
    await bouncer.with(RundownPolicy).authorize('manageCompanionServers')

    const servers = await new ListCompanionServers().handle()

    return inertia.render('rundowns/companion_servers/index', {
      companionServers: CompanionServerTransformer.transform(servers).useVariant('forList'),
    })
  }

  public async store({ bouncer, request, response }: HttpContext) {
    await bouncer.with(RundownPolicy).authorize('manageCompanionServers')

    const payload = await request.validateUsing(createCompanionServerValidator)

    await new CreateCompanionServer().handle(payload)

    return response.redirect().toRoute('companion_servers.index')
  }

  public async show({ bouncer, inertia, params }: HttpContext) {
    const server = await CompanionServer.findOrFail(params.id)

    await bouncer.with(RundownPolicy).authorize('manageCompanionServers')

    return inertia.render('rundowns/companion_servers/show', {
      companionServer: CompanionServerTransformer.transform(server).useVariant('forShow'),
      channel: companionChannel(server.id),
      live: await this.live.snapshot(server),
    })
  }

  public async update({ bouncer, params, request, response }: HttpContext) {
    const server = await CompanionServer.findOrFail(params.id)

    await bouncer.with(RundownPolicy).authorize('manageCompanionServers')

    const payload = await request.validateUsing(editCompanionServerValidator, {
      meta: { companionServerId: server.id },
    })

    await new UpdateCompanionServer().handle({ target: server, ...payload })
    this.live.refresh(server)

    return response.redirect().back()
  }

  public async destroy({ bouncer, params, response }: HttpContext) {
    const server = await CompanionServer.findOrFail(params.id)

    await bouncer.with(RundownPolicy).authorize('manageCompanionServers')

    await new DeleteCompanionServer().handle({ target: server })
    this.live.remove(server.id)

    return response.redirect().toRoute('companion_servers.index')
  }
}
