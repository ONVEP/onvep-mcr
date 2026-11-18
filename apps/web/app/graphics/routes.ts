import router from '@adonisjs/core/services/router'

import { controllers } from '#generated/controllers'
import { middleware } from '#start/kernel'

const { Assets, Cg, CssVariables, CustomCss, Layers, TailwindClasses } = controllers.graphics

router
  .group(() => {
    router.get('/layers/', [Layers, 'index']).as('layers.index')
    router.post('/layers/', [Layers, 'store']).as('layers.store')
    router.get('/layers/:id', [Layers, 'show']).as('layers.show')
    router.put('/layers/:id', [Layers, 'update']).as('layers.update')
    router.delete('/layers/:id', [Layers, 'destroy']).as('layers.destroy')
    router.get('/tailwind-classes', [TailwindClasses]).as('graphics.tailwind_classes')
  })
  .prefix('/graphics')
  .where('id', router.matchers.number())
  .middleware(middleware.auth())

router
  .put('/graphics/css-variables/stylesheet', [CustomCss, 'update'])
  .use(middleware.auth())
  .as('custom_css.update')

router
  .resource('/graphics/css-variables', CssVariables)
  .only(['index', 'store', 'update', 'destroy'])
  .where('id', router.matchers.number())
  .use('*', middleware.auth())
  .as('css_variables')

router
  .resource('/graphics/assets', Assets)
  .only(['index', 'store', 'update', 'destroy'])
  .where('id', router.matchers.number())
  .use('*', middleware.auth())
  .as('assets')

// Public: consumed by playout software, which can't log in.
router
  .group(() => {
    router.get('/all', [Cg, 'all']).as('all')
    router.get('/layer/:slug', [Cg, 'layer']).as('layer')
    router.get('/assets/tailwind.js', [Cg, 'tailwind']).as('tailwind')
    router.get('/assets/transmit.js', [Cg, 'transmit']).as('transmit')
    router.get('/assets/ctx.js', [Cg, 'ctx']).as('ctx')
    router.get('/files/:name', [Cg, 'file']).as('file')
  })
  .prefix('/cg')
  .as('cg')
