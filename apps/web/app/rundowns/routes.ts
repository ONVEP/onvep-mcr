import router from '@adonisjs/core/services/router'
import transmit from '@adonisjs/transmit/services/main'

import { controllers } from '#generated/controllers'
import { middleware } from '#start/kernel'
import RundownPolicy from '#rundowns/policies/rundown_policy'

const { CompanionServers, Live, Rundowns, Steps, StepMoves, StepTypes } = controllers.rundowns

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

router
  .resource('/rundowns/companion-servers', CompanionServers)
  .only(['index', 'store', 'show', 'update', 'destroy'])
  .where('id', router.matchers.number())
  .use('*', middleware.auth())
  .as('companion_servers')

// Must match companionChannel() in #rundowns/services/companion_live.
transmit.authorize('companion_servers/:id', async (ctx) => {
  await ctx.auth.check()
  return (
    !!ctx.auth.user && (await new RundownPolicy().manageCompanionServers(ctx.auth.user)) === true
  )
})
