import type { ApplicationService } from '@adonisjs/core/types'
import type { ContextConfig } from '#context/define_config'
import { ContextEngine } from '#context/services/context_engine'
import { ContextStore } from '#context/services/context_store'
import { MutatorRegistry } from '#context/services/mutator_registry'
import { ValidatorRegistry } from '#context/services/validator_registry'

export default class ContextProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.singleton(ContextEngine, async (resolver) => {
      const config = this.app.config.get<ContextConfig>('context')
      const drive = await resolver.make('drive.manager')
      const transmit = await resolver.make('transmit')

      return new ContextEngine(
        config,
        new ContextStore(),
        // Resolved lazily so `drive.fake()` in tests swaps the disk
        new MutatorRegistry(() => drive.use(config.mutatorsDisk)),
        new ValidatorRegistry(),
        transmit
      )
    })
  }

  async start() {
    // Only the HTTP server serves the context. Ace commands (migration:run
    // included) and tests start the app before the table exists.
    if (this.app.getEnvironment() !== 'web') return
    const engine = await this.app.container.make(ContextEngine)
    await engine.boot()
  }
}
