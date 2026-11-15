import router from '@adonisjs/core/services/router'
import transmit from '@adonisjs/transmit/services/main'

import { controllers } from '#generated/controllers'
import { middleware } from '#start/kernel'

const { Notifications } = controllers.notifications

router
  .group(() => {
    router.get('/notifications', [Notifications, 'index']).as('notifications.index')

    router.post('/notifications/:id/read', [Notifications, 'markRead']).as('notifications.markRead')

    router
      .post('/notifications/seen', [Notifications, 'markAllSeen'])
      .as('notifications.markAllSeen')

    router
      .post('/notifications/read', [Notifications, 'markAllRead'])
      .as('notifications.markAllRead')
  })
  .use([middleware.auth()])

// Transmit 3 no longer registers its SSE endpoints on its own. They stay public: CG pages
// (playout software, no login) subscribe too, so each private channel needs an authorize().
transmit.registerRoutes()

// Matches Facteur's per-user channel `notifications/user-<id>`.
transmit.authorize<{ target: string }>('notifications/:target', async (ctx, { target }) => {
  await ctx.auth.check()
  return !!ctx.auth.user && target === `user-${ctx.auth.user.id}`
})
