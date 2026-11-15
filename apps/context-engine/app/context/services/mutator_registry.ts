import type { Disk } from '@adonisjs/drive'
import InvalidMutatorException from '#context/exceptions/invalid_mutator_exception'
import MutatorNotFoundException from '#context/exceptions/mutator_not_found_exception'
import type { JsonObject, PathSegments } from '#context/lib/path'
import { parsePath } from '#context/lib/path'

export type MutatorHandler = (
  oldContext: JsonObject,
  newContext: JsonObject
) => JsonObject | Promise<JsonObject>

export type Mutator = {
  /** Disk key of the source file — also defines the execution order */
  name: string
  subscriptions: string[]
  patterns: PathSegments[]
  handle: MutatorHandler
}

const MUTATOR_EXTENSIONS = ['.js', '.mjs']

/** Slash-separated folders allowed, but no `..` nor absolute paths */
const MUTATOR_NAME = /^[\w-]+(\/[\w-]+)*\.m?js$/

/**
 * Loads mutator scripts from a drive disk. A mutator module exports:
 *
 *   export const subscriptions = ['layers', 'rundown.*.status']
 *   export default function (oldContext, newContext) { return newContext }
 *
 * Modules are imported from a data: URL so any drive driver works; as a
 * consequence they may only import `node:` builtins, not relative files or
 * packages.
 */
export class MutatorRegistry {
  #mutators: Mutator[] = []

  constructor(private disk: () => Disk) {}

  all(): readonly Mutator[] {
    return this.#mutators
  }

  /**
   * Loads every mutator before swapping, so a broken file leaves the
   * previously loaded set in place.
   */
  async reload() {
    const keys = await this.#listKeys()
    const mutators: Mutator[] = []
    for (const key of keys) {
      mutators.push(await this.#evaluate(key, await this.disk().get(key)))
    }
    this.#mutators = mutators
    return this.#mutators
  }

  async read(name: string) {
    const disk = this.disk()
    if (!MUTATOR_NAME.test(name) || !(await disk.exists(name))) {
      throw new MutatorNotFoundException(name)
    }
    return disk.get(name)
  }

  /**
   * Creates or replaces a mutator. The source is evaluated first, so a
   * broken mutator never reaches the disk.
   */
  async write(name: string, source: string) {
    if (!MUTATOR_NAME.test(name)) {
      throw new InvalidMutatorException(
        `Invalid mutator name "${name}": use letters, digits, "_", "-" and "/", ending with .js or .mjs`,
        { status: 422 }
      )
    }
    await this.#evaluate(name, source, 422)
    await this.disk().put(name, source)
    return this.reload()
  }

  async remove(name: string) {
    await this.read(name)
    await this.disk().delete(name)
    return this.reload()
  }

  async #listKeys() {
    const disk = this.disk()
    const keys: string[] = []
    let paginationToken: string | undefined
    do {
      const page = await disk.listAll('', { recursive: true, paginationToken })
      for (const object of page.objects) {
        if (object.isFile && MUTATOR_EXTENSIONS.some((ext) => object.key.endsWith(ext))) {
          keys.push(object.key)
        }
      }
      paginationToken = page.paginationToken
    } while (paginationToken)
    return keys.sort()
  }

  /**
   * `status` is 500 for files already on the disk (server state is broken)
   * and 422 for sources submitted through the API.
   */
  async #evaluate(key: string, source: string, status = 500): Promise<Mutator> {
    let module: Record<string, unknown>
    try {
      module = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
    } catch (error) {
      throw new InvalidMutatorException(
        `Cannot import mutator "${key}": ${(error as Error).message}`,
        { cause: error, status }
      )
    }

    const { subscriptions, default: handle } = module
    if (
      !Array.isArray(subscriptions) ||
      !subscriptions.every((subscription) => typeof subscription === 'string')
    ) {
      throw new InvalidMutatorException(
        `Mutator "${key}" must export "subscriptions" as an array of strings`,
        { status }
      )
    }
    if (typeof handle !== 'function') {
      throw new InvalidMutatorException(`Mutator "${key}" must default-export a function`, {
        status,
      })
    }

    let patterns: PathSegments[]
    try {
      patterns = subscriptions.map(parsePath)
    } catch (error) {
      throw new InvalidMutatorException(
        `Mutator "${key}" has an invalid subscription: ${(error as Error).message}`,
        { status }
      )
    }

    return { name: key, subscriptions, patterns, handle: handle as MutatorHandler }
  }
}
