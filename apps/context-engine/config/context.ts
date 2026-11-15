import env from '#start/env'
import { defineConfig } from '#context/define_config'

export default defineConfig({
  mutatorsDisk: 'mutators',
  maxMutatorPasses: env.get('MAX_MUTATOR_PASSES', 10),
  initialContext: {},
})
