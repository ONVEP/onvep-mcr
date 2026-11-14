import router from '@adonisjs/core/services/router'

import { controllers } from '#generated/controllers'
import { middleware } from '#start/kernel'

const { NetworkDrives } = controllers.media

router
  .resource('/media/network-drives', NetworkDrives)
  .only(['index', 'create', 'store', 'edit', 'update', 'destroy'])
  .where('id', router.matchers.number())
  .use('*', middleware.auth())
  .as('network_drives')
