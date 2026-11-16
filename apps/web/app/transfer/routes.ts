import router from '@adonisjs/core/services/router'

import { controllers } from '#generated/controllers'
import { middleware } from '#start/kernel'

const { Exports, Imports, Transfer } = controllers.transfer

router
  .group(() => {
    router.get('/', [Transfer, 'index']).as('transfer.index')
    router.post('/export', [Exports]).as('transfer.export')
    router.post('/import', [Imports]).as('transfer.import')
  })
  .prefix('/transfer')
  .middleware(middleware.auth())
