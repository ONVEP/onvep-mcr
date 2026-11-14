import type { HttpContext } from '@adonisjs/core/http'

import CreateNetworkDrive from '#media/actions/create_network_drive'
import DeleteNetworkDrive from '#media/actions/delete_network_drive'
import UpdateNetworkDrive from '#media/actions/update_network_drive'
import NetworkDrive from '#media/models/network_drive'
import NetworkDrivePolicy from '#media/policies/network_drive_policy'
import ListNetworkDrives from '#media/queries/list_network_drives'
import NetworkDriveTransformer from '#media/transformers/network_drive_transformer'
import {
  createNetworkDriveValidator,
  editNetworkDriveValidator,
  listNetworkDriveValidator,
} from '#media/validators/network_drives'

export default class NetworkDrivesController {
  public async index({ bouncer, inertia, request }: HttpContext) {
    await bouncer.with(NetworkDrivePolicy).authorize('viewList')

    const payload = await request.validateUsing(listNetworkDriveValidator)

    const drives = await new ListNetworkDrives().handle(
      { q: payload.q },
      { page: payload.page ?? 1, perPage: payload.perPage ?? 10 }
    )

    return inertia.render('media/network_drives/index', {
      networkDrives: NetworkDriveTransformer.paginate(drives.all(), drives.getMeta()).useVariant(
        'forList'
      ),
      q: payload.q,
    })
  }

  public async create({ bouncer, inertia }: HttpContext) {
    await bouncer.with(NetworkDrivePolicy).authorize('create')

    return inertia.modal('media/network_drives/create', {}, { route: 'network_drives.index' })
  }

  public async store({ bouncer, request, response }: HttpContext) {
    await bouncer.with(NetworkDrivePolicy).authorize('create')

    const payload = await request.validateUsing(createNetworkDriveValidator)

    await new CreateNetworkDrive().handle(payload)

    return response.redirect().toRoute('network_drives.index')
  }

  public async edit({ bouncer, inertia, params }: HttpContext) {
    const drive = await NetworkDrive.findOrFail(params.id)

    await bouncer.with(NetworkDrivePolicy).authorize('update')

    return inertia.modal(
      'media/network_drives/edit',
      { networkDrive: NetworkDriveTransformer.transform(drive).useVariant('forEdit') },
      { route: 'network_drives.index' }
    )
  }

  public async update({ bouncer, params, request, response }: HttpContext) {
    const drive = await NetworkDrive.findOrFail(params.id)

    await bouncer.with(NetworkDrivePolicy).authorize('update')

    const payload = await request.validateUsing(editNetworkDriveValidator, {
      meta: { networkDriveId: drive.id },
    })

    await new UpdateNetworkDrive().handle({
      target: drive,
      name: payload.name,
      url: payload.url,
      username: payload.username,
      password: payload.password,
    })

    return response.redirect().toRoute('network_drives.index')
  }

  public async destroy({ bouncer, params, response }: HttpContext) {
    const drive = await NetworkDrive.findOrFail(params.id)

    await bouncer.with(NetworkDrivePolicy).authorize('delete')

    await new DeleteNetworkDrive().handle({ target: drive })

    return response.redirect().toRoute('network_drives.index')
  }
}
