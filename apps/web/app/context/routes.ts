import router from '@adonisjs/core/services/router'

import { controllers } from '#generated/controllers'
import { middleware } from '#start/kernel'

const { Context, ContextValues, Mutators, Validators, Versions } = controllers.context

router
  .group(() => {
    router.get('/', [Context, 'index']).as('context.index')

    router.put('/values', [ContextValues, 'update']).as('context.values.update')
    router.post('/values', [ContextValues, 'store']).as('context.values.store')
    router.delete('/values', [ContextValues, 'destroy']).as('context.values.destroy')

    router.get('/mutators', [Mutators, 'index']).as('context.mutators.index')
    router.post('/mutators', [Mutators, 'store']).as('context.mutators.store')
    // Names may contain folders: they travel URL-encoded in a single segment.
    router.get('/mutators/:name', [Mutators, 'show']).as('context.mutators.show')
    router.put('/mutators/:name', [Mutators, 'update']).as('context.mutators.update')
    router.delete('/mutators/:name', [Mutators, 'destroy']).as('context.mutators.destroy')

    router.get('/validators', [Validators, 'index']).as('context.validators.index')
    router.post('/validators', [Validators, 'store']).as('context.validators.store')
    router.get('/validators/:id', [Validators, 'show']).as('context.validators.show')
    router.put('/validators/:id', [Validators, 'update']).as('context.validators.update')
    router.delete('/validators/:id', [Validators, 'destroy']).as('context.validators.destroy')

    router.get('/versions', [Versions, 'index']).as('context.versions.index')
    router.get('/versions/:id', [Versions, 'show']).as('context.versions.show')
    router.post('/versions/:id/restore', [Versions, 'restore']).as('context.versions.restore')
  })
  .prefix('/context')
  .where('id', router.matchers.number())
  .middleware(middleware.auth())
