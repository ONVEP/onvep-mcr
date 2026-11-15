import { defineConfig } from '@adonisjs/core/app'

export default defineConfig({
  experimental: {},

  commands: [() => import('@adonisjs/core/commands'), () => import('@adonisjs/lucid/commands')],

  providers: [
    () => import('@adonisjs/core/providers/app_provider'),
    {
      file: () => import('@adonisjs/core/providers/repl_provider'),
      environment: ['repl', 'test'],
    },
    () => import('@adonisjs/core/providers/vinejs_provider'),
    () => import('@adonisjs/cors/cors_provider'),
    () => import('@adonisjs/lucid/database_provider'),
    () => import('@adonisjs/drive/drive_provider'),
    () => import('@adonisjs/transmit/transmit_provider'),
    () => import('#providers/context_provider'),
  ],

  preloads: [() => import('#start/kernel'), () => import('#context/routes')],

  tests: {
    suites: [
      {
        files: ['app/**/tests/unit/**/*.spec.{ts,js}'],
        name: 'unit',
        timeout: 2000,
      },
      {
        files: ['app/**/tests/functional/**/*.spec.{ts,js}'],
        name: 'functional',
        timeout: 30000,
      },
    ],
    forceExit: false,
  },
})
