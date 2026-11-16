import app from '@adonisjs/core/services/app'
import { defineConfig, formatters, loaders } from '@adonisjs/i18n'

const i18nConfig = defineConfig({
  defaultLocale: 'en',
  supportedLocales: ['en', 'fr'],
  formatter: formatters.icu(),

  loaders: [
    /**
     * The fs loader will read translations from the
     * "resources/lang" directory.
     *
     * Each subdirectory represents a locale. For example:
     *   - "resources/lang/en"
     *   - "resources/lang/fr"
     *   - "resources/lang/it"
     */
    // loaders.fs({
    //   location: app.languageFilesPath(),
    // }),
    loaders.fs({
      location: app.makePath('app/users/resources/lang'),
    }),
    loaders.fs({
      location: app.makePath('app/common/resources/lang'),
    }),
    loaders.fs({
      location: app.makePath('app/auth/resources/lang'),
    }),
    loaders.fs({
      location: app.makePath('app/analytics/resources/lang'),
    }),
    loaders.fs({
      location: app.makePath('app/media/resources/lang'),
    }),
    loaders.fs({
      location: app.makePath('app/rundowns/resources/lang'),
    }),
    loaders.fs({
      location: app.makePath('app/graphics/resources/lang'),
    }),
    loaders.fs({
      location: app.makePath('app/context/resources/lang'),
    }),
    loaders.fs({
      location: app.makePath('app/marketing/resources/lang'),
    }),
  ],
})

export default i18nConfig
