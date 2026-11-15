import type { DriveDisks } from '@adonisjs/drive/types'
import type { JsonObject } from '#context/lib/path'

export type ContextConfig = {
  /** Drive disk holding the mutator scripts */
  mutatorsDisk: keyof DriveDisks
  /**
   * Mutators re-run while other mutators change what they subscribe to.
   * Past this many passes the update is considered an infinite loop and
   * rolled back.
   */
  maxMutatorPasses: number
  /** Context used when nothing has been persisted yet */
  initialContext: JsonObject
}

export function defineConfig(config: ContextConfig): ContextConfig {
  return config
}
