import type transmitService from '@adonisjs/transmit/services/main'
import type { ContextConfig } from '#context/define_config'
import InvalidPathException from '#context/exceptions/invalid_path_exception'
import MutatorException from '#context/exceptions/mutator_exception'
import MutatorLoopException from '#context/exceptions/mutator_loop_exception'
import PathNotFoundException from '#context/exceptions/path_not_found_exception'
import VersionNotFoundException from '#context/exceptions/version_not_found_exception'
import type { JsonObject, JsonValue, PathSegments } from '#context/lib/path'
import {
  deepEqual,
  diffPaths,
  formatPath,
  getAt,
  isPlainObject,
  isRelated,
  mergePatch,
  parsePath,
  setAt,
  unsetAt,
} from '#context/lib/path'
import type { ContextStore } from '#context/services/context_store'
import type { Mutator, MutatorRegistry } from '#context/services/mutator_registry'
import type { ValidatorRegistry } from '#context/services/validator_registry'

export const CHANNEL_PREFIX = 'context'

export function channelFor(path: string) {
  return path === '' ? CHANNEL_PREFIX : `${CHANNEL_PREFIX}/${path}`
}

export type ContextUpdate = {
  path: string
  value?: JsonValue
  /** Deepest paths whose value changed, after mutators ran */
  changes: string[]
  /** Id of the persisted version, absent when the update changed nothing */
  version?: number
}

export type UpdateOptions = {
  /** Commit the operation's result as-is, without running mutators */
  bypassMutators?: boolean
}

export type ContextNotification = {
  path: string
  value?: JsonValue
  changes: string[]
}

/**
 * Receives the working copy and returns the next root context.
 */
type Operation = (draft: JsonObject, segments: PathSegments) => JsonObject

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value)) deepFreeze(child)
  }
  return value
}

/**
 * Owns the global context. Every write goes through the same pipeline,
 * one at a time:
 *
 *   operation → mutators → validators → persist → broadcast
 *
 * Anything thrown before persist discards the working copy, so the
 * committed context is never partially updated.
 */
export class ContextEngine {
  /** Committed context — deep-frozen so neither readers nor mutators can alter it */
  #context: JsonObject = deepFreeze({})
  #queue: Promise<unknown> = Promise.resolve()

  constructor(
    private config: ContextConfig,
    private store: ContextStore,
    readonly mutators: MutatorRegistry,
    readonly validators: ValidatorRegistry,
    private transmit: typeof transmitService
  ) {}

  async boot() {
    const persisted = await this.store.load()
    this.#context = deepFreeze(persisted ?? structuredClone(this.config.initialContext))
    await this.mutators.reload()
    await this.validators.reload()
  }

  get(path: string): JsonValue | undefined {
    return getAt(this.#context, parsePath(path))
  }

  listMutators() {
    return this.mutators
      .all()
      .map(({ name, subscriptions, enabled }) => ({ name, subscriptions, enabled }))
  }

  async reloadMutators() {
    await this.mutators.reload()
    return this.listMutators()
  }

  set(path: string, value: JsonValue) {
    return this.#update(path, (draft, segments) => {
      if (segments.length === 0) {
        if (!isPlainObject(value)) {
          throw new InvalidPathException('The root context must be an object')
        }
        return value
      }
      setAt(draft, segments, value)
      return draft
    })
  }

  /**
   * Applies `patch` as a JSON Merge Patch (RFC 7386) on the value at `path`.
   */
  merge(path: string, patch: JsonValue) {
    return this.#update(path, (draft, segments) => {
      const merged = mergePatch(getAt(draft, segments), patch)
      if (segments.length === 0) {
        if (!isPlainObject(merged)) {
          throw new InvalidPathException('The root context must be an object')
        }
        return merged
      }
      setAt(draft, segments, merged)
      return draft
    })
  }

  append(path: string, value: JsonValue) {
    return this.#update(path, (draft, segments) => {
      const target = getAt(draft, segments)
      if (target === undefined && segments.length > 0) {
        setAt(draft, segments, [value])
        return draft
      }
      if (!Array.isArray(target)) {
        throw new InvalidPathException(`"${formatPath(segments)}" is not an array`)
      }
      target.push(value)
      return draft
    })
  }

  remove(path: string) {
    return this.#update(path, (draft, segments) => {
      if (segments.length === 0) {
        throw new InvalidPathException('The root context cannot be removed')
      }
      if (!unsetAt(draft, segments)) throw new PathNotFoundException(path)
      return draft
    })
  }

  listVersions(page: number, perPage: number) {
    return this.store.paginate(page, perPage)
  }

  async findVersion(id: number) {
    const version = await this.store.find(id)
    if (!version) throw new VersionNotFoundException(id)
    return version
  }

  /**
   * Makes an old version the live context again. History is append-only:
   * the restored content is committed as a new version. Validators always
   * run, so a version that no longer satisfies them can't be restored.
   */
  async restore(id: number, options: UpdateOptions = {}) {
    const version = await this.findVersion(id)
    return this.#update('', () => structuredClone(version.context), options)
  }

  #update(path: string, operation: Operation, options: UpdateOptions = {}): Promise<ContextUpdate> {
    const segments = parsePath(path)
    return this.#serialize(async () => {
      const previous = this.#context
      let next = operation(structuredClone(previous), segments)

      if (!options.bypassMutators && diffPaths(previous, next).length > 0) {
        next = await this.#runMutators(previous, next)
      }

      const changes = diffPaths(previous, next)
      let version: number | undefined
      if (changes.length > 0) {
        this.validators.validate(next, changes)
        const saved = await this.store.save(next)
        version = saved.id
        this.#context = deepFreeze(next)
        this.#broadcast(previous, this.#context, changes)
      }

      return {
        path,
        value: getAt(this.#context, segments),
        changes: changes.map(formatPath),
        version,
      }
    })
  }

  /**
   * Runs mutators in name order, in passes, until none is triggered anymore.
   * A mutator is triggered by what changed since it last ran (or since the
   * committed context), so it reacts to other mutators — earlier or later in
   * the order — but never to its own output. Mutators that keep re-triggering
   * each other past `maxMutatorPasses` abort the update.
   */
  async #runMutators(previous: JsonObject, draft: JsonObject) {
    const mutators = this.mutators.all().filter((mutator) => mutator.enabled)
    const lastSeen = new Map<Mutator, JsonObject>()
    let next = draft
    let ranInPreviousPass: string[] = []

    for (let pass = 1; ; pass++) {
      const triggered = []
      for (const mutator of mutators) {
        const changes = diffPaths(lastSeen.get(mutator) ?? previous, next)
        const isTriggered = mutator.patterns.some((pattern) =>
          changes.some((change) => isRelated(pattern, change))
        )
        if (!isTriggered) continue
        triggered.push(mutator.name)
        if (pass > this.config.maxMutatorPasses) continue

        const output = this.#normalize(mutator, await this.#runMutator(mutator, previous, next))
        lastSeen.set(mutator, deepFreeze(output))
        next = structuredClone(output)
      }

      if (triggered.length === 0) return next
      if (pass > this.config.maxMutatorPasses) {
        // Those still triggered alone may hide half of a ping-pong.
        const looping = new Set([...ranInPreviousPass, ...triggered])
        throw new MutatorLoopException([...looping], this.config.maxMutatorPasses)
      }
      ranInPreviousPass = triggered
    }
  }

  async #runMutator(mutator: Mutator, previous: JsonObject, next: JsonObject) {
    let result: unknown
    try {
      result = await mutator.handle(previous, next)
    } catch (error) {
      throw new MutatorException(mutator.name, (error as Error)?.message ?? String(error), {
        cause: error,
      })
    }
    if (!isPlainObject(result)) {
      throw new MutatorException(mutator.name, 'it must return the context object')
    }
    return result
  }

  /**
   * Mutators may return non-JSON values (Date, undefined, …): normalize so
   * what is persisted is exactly what is broadcast and served. Also detaches
   * the output from objects the mutator may still hold.
   */
  #normalize(mutator: Mutator, result: JsonObject) {
    try {
      return JSON.parse(JSON.stringify(result)) as JsonObject
    } catch (error) {
      throw new MutatorException(mutator.name, 'it returned a context not serializable to JSON', {
        cause: error,
      })
    }
  }

  /**
   * Notifies every subscribed `context/<path>` channel whose value changed:
   * subscribers of an ancestor of a changed path, as well as subscribers of a
   * descendant of a replaced subtree.
   */
  #broadcast(previous: JsonObject, next: JsonObject, changes: PathSegments[]) {
    const channels = new Set<string>()
    for (const subscribed of this.transmit.getManager().getAllSubscribers().values()) {
      for (const channel of subscribed) {
        if (channel === CHANNEL_PREFIX || channel.startsWith(`${CHANNEL_PREFIX}/`)) {
          channels.add(channel)
        }
      }
    }

    for (const channel of channels) {
      const path = channel.slice(CHANNEL_PREFIX.length + 1)
      let segments: PathSegments
      try {
        segments = parsePath(path)
      } catch {
        continue
      }

      const related = changes.filter((change) => isRelated(segments, change))
      if (related.length === 0) continue

      // Below a changed path the subtree may have been replaced by an equal value.
      const isBelowEveryChange = related.every((change) => segments.length > change.length)
      const value = getAt(next, segments)
      if (isBelowEveryChange && deepEqual(getAt(previous, segments), value)) continue

      const payload: ContextNotification = { path, changes: related.map(formatPath) }
      if (value !== undefined) payload.value = value
      this.transmit.broadcast(channel, payload)
    }
  }

  #serialize<T>(task: () => Promise<T>): Promise<T> {
    const run = this.#queue.then(task, task)
    this.#queue = run.catch(() => {})
    return run
  }
}
