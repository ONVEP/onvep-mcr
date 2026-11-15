import router from '@adonisjs/core/services/router'
import transmit from '@adonisjs/transmit/services/main'

const ContextController = () => import('#context/controllers/context_controller')
const MutatorsController = () => import('#context/controllers/mutators_controller')
const ValidatorsController = () => import('#context/controllers/validators_controller')
const VersionsController = () => import('#context/controllers/versions_controller')

/**
 * SSE endpoints. Subscribe to `context` for the whole tree, or to
 * `context/<path>` (e.g. `context/layers.0.name`) for a subtree.
 */
transmit.registerRoutes()

router
  .group(() => {
    router.get('/:path?', [ContextController, 'show']).as('show')
    router.put('/:path?', [ContextController, 'update']).as('update')
    router.patch('/:path?', [ContextController, 'merge']).as('merge')
    router.post('/:path?', [ContextController, 'append']).as('append')
    router.delete('/:path', [ContextController, 'destroy']).as('destroy')
  })
  .prefix('/context')
  .as('context')

router
  .group(() => {
    router.get('/', [MutatorsController, 'index']).as('index')
    router.post('/reload', [MutatorsController, 'reload']).as('reload')
    router.get('/*', [MutatorsController, 'show']).as('show')
    router.put('/*', [MutatorsController, 'update']).as('update')
    router.delete('/*', [MutatorsController, 'destroy']).as('destroy')
  })
  .prefix('/mutators')
  .as('mutators')

router
  .group(() => {
    router.get('/', [VersionsController, 'index']).as('index')
    router.get('/:id', [VersionsController, 'show']).as('show')
    router.post('/:id/restore', [VersionsController, 'restore']).as('restore')
  })
  .prefix('/versions')
  .where('id', router.matchers.number())
  .as('versions')

router.resource('/validators', ValidatorsController).apiOnly().where('id', router.matchers.number())
