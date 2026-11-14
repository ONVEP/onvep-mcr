import router from '@adonisjs/core/services/router'

import { controllers } from '#generated/controllers'
import { middleware } from '#start/kernel'

const { Live, Rundowns, Steps, StepMoves, StepTypes } = controllers.rundowns

router.get('/live', [Live]).middleware(middleware.auth()).as('live.show')

router
  .group(() => {
    router
      .resource('/preparation', Rundowns)
      .only(['index', 'create', 'store', 'show', 'edit', 'update', 'destroy'])
      .where('id', router.matchers.number())
      .as('rundowns')

    router
      .group(() => {
        router.post('/', [Steps, 'store']).as('store')
        router.put('/:id', [Steps, 'update']).as('update')
        router.delete('/:id', [Steps, 'destroy']).as('destroy')
        router.post('/:id/move', [StepMoves]).as('move')
      })
      .prefix('/preparation/:rundown_id/steps')
      .where('rundown_id', router.matchers.number())
      .where('id', router.matchers.number())
      .as('steps')
  })
  .middleware(middleware.auth())

router
  .resource('/rundowns/step-types', StepTypes)
  .only(['index', 'store', 'update', 'destroy'])
  .where('id', router.matchers.number())
  .use('*', middleware.auth())
  .as('step_types')
