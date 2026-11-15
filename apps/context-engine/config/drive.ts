import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig, services } from '@adonisjs/drive'

const driveConfig = defineConfig({
  default: 'mutators',

  services: {
    /**
     * Holds the mutator scripts (*.js / *.mjs) run on every context update.
     */
    mutators: services.fs({
      location: app.makePath(env.get('MUTATORS_PATH')),
      serveFiles: false,
      visibility: 'private',
    }),
  },
})

export default driveConfig

declare module '@adonisjs/drive/types' {
  export interface DriveDisks extends InferDriveDisks<typeof driveConfig> {}
}
