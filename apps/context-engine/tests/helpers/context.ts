import app from '@adonisjs/core/services/app'
import drive from '@adonisjs/drive/services/main'
import type { ContextConfig } from '#context/define_config'
import type { JsonObject } from '#context/lib/path'
import ContextValidator from '#context/models/context_validator'
import ContextVersion from '#context/models/context_version'
import { ContextEngine } from '#context/services/context_engine'
import { ContextStore } from '#context/services/context_store'
import { MutatorRegistry } from '#context/services/mutator_registry'
import { ValidatorRegistry } from '#context/services/validator_registry'

export async function latestVersion() {
  return ContextVersion.query().orderBy('id', 'desc').firstOrFail()
}

/**
 * Builds a fresh engine booted from the database + a fake mutators disk and
 * swaps it into the container, so HTTP requests hit it. Groups wrap each test
 * in a global transaction, so the history starts empty.
 */
export async function setupContextEngine(
  options: Partial<Pick<ContextConfig, 'initialContext' | 'maxMutatorPasses'>> & {
    /** JSON Schemas keyed by context path */
    validators?: Record<string, JsonObject>
  } = {}
) {
  const { validators = {}, ...overrides } = options
  const config = app.config.get<ContextConfig>('context')
  for (const [path, schema] of Object.entries(validators)) {
    await ContextValidator.create({ path, schema })
  }

  const disk = drive.fake('mutators')
  const transmit = await app.container.make('transmit')
  const engine = new ContextEngine(
    { ...config, ...overrides },
    new ContextStore(),
    new MutatorRegistry(() => drive.use('mutators')),
    new ValidatorRegistry(),
    transmit
  )
  await engine.boot()
  app.container.swap(ContextEngine, () => engine)

  return {
    engine,
    disk,
    /** Writes a mutator file to the fake disk and reloads the registry */
    async addMutator(name: string, source: string) {
      await disk.put(name, source)
      await engine.reloadMutators()
    },
    async seed(context: JsonObject) {
      await engine.set('', context)
    },
    cleanup() {
      app.container.restore(ContextEngine)
      drive.restore('mutators')
    },
  }
}
