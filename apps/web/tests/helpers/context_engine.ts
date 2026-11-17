import app from '@adonisjs/core/services/app'

import ContextEngineException from '#context/exceptions/context_engine_exception'
import ContextEngineUnavailableException from '#context/exceptions/context_engine_unavailable_exception'
import { ContextEngineClient } from '#context/services/context_engine_client'
import type {
  ContextMutator,
  ContextValidator,
  ContextValidatorDefinition,
  ContextVersion,
  JsonObject,
  JsonValue,
} from '#context/types/engine'

/**
 * In-memory stand-in for the context engine: records every call and serves
 * canned data, so web specs don't need the engine running.
 */
export class FakeContextEngine extends ContextEngineClient {
  calls: { method: string; args: unknown[] }[] = []
  context: JsonObject = {}
  mutators: ContextMutator[] = []
  validators: ContextValidator[] = []
  /** Newest first, like the engine */
  versions: ContextVersion[] = []
  /** Next call throws this, then the fake behaves normally again */
  nextError: Error | null = null

  constructor() {
    super('http://context-engine.test')
  }

  #record(method: string, ...args: unknown[]) {
    this.calls.push({ method, args })
    if (this.nextError) {
      const error = this.nextError
      this.nextError = null
      throw error
    }
  }

  rejectNext(status: number, message: string) {
    this.nextError = new ContextEngineException(status, { message })
  }

  goOffline() {
    this.nextError = new ContextEngineUnavailableException('offline')
  }

  override async getValue(path: string) {
    this.#record('getValue', path)
    return this.context as JsonValue
  }

  override async setValue(path: string, value: JsonValue) {
    this.#record('setValue', path, value)
  }

  override async appendValue(path: string, value: JsonValue) {
    this.#record('appendValue', path, value)
  }

  override async removeValue(path: string) {
    this.#record('removeValue', path)
  }

  override async listMutators() {
    this.#record('listMutators')
    return this.mutators.map(({ name, subscriptions, enabled }) => ({
      name,
      subscriptions,
      enabled,
    }))
  }

  override async getMutator(name: string) {
    this.#record('getMutator', name)
    const mutator = this.mutators.find((candidate) => candidate.name === name)
    if (!mutator) throw new ContextEngineException(404, { message: 'not found' })
    return mutator
  }

  override async saveMutator(name: string, source: string) {
    this.#record('saveMutator', name, source)
    return this.listMutators()
  }

  override async setMutatorEnabled(name: string, enabled: boolean) {
    this.#record('setMutatorEnabled', name, enabled)
    return this.listMutators()
  }

  override async deleteMutator(name: string) {
    this.#record('deleteMutator', name)
    return this.listMutators()
  }

  override async listValidators() {
    this.#record('listValidators')
    return this.validators
  }

  override async getValidator(id: number) {
    this.#record('getValidator', id)
    const validator = this.validators.find((candidate) => candidate.id === id)
    if (!validator) throw new ContextEngineException(404, { message: 'not found' })
    return validator
  }

  override async createValidator(definition: ContextValidatorDefinition) {
    this.#record('createValidator', definition)
    return { id: 42, enabled: true, ...definition, createdAt: '', updatedAt: '' }
  }

  override async updateValidator(id: number, definition: ContextValidatorDefinition) {
    this.#record('updateValidator', id, definition)
    return { id, enabled: true, ...definition, createdAt: '', updatedAt: '' }
  }

  override async deleteValidator(id: number) {
    this.#record('deleteValidator', id)
    return null
  }

  override async listVersions(page: number, perPage: number) {
    this.#record('listVersions', page, perPage)
    const data = this.versions
      .slice((page - 1) * perPage, page * perPage)
      .map(({ id, createdAt }) => ({ id, createdAt }))
    const total = this.versions.length
    return {
      meta: {
        total,
        perPage,
        currentPage: page,
        lastPage: Math.max(1, Math.ceil(total / perPage)),
      },
      data,
    }
  }

  override async getVersion(id: number) {
    this.#record('getVersion', id)
    const version = this.versions.find((candidate) => candidate.id === id)
    if (!version) throw new ContextEngineException(404, { message: 'not found' })
    return version
  }

  override async restoreVersion(id: number, bypassMutators: boolean) {
    this.#record('restoreVersion', id, bypassMutators)
    return { changes: [''], version: 999 }
  }

  callsTo(method: string) {
    return this.calls.filter((call) => call.method === method).map((call) => call.args)
  }
}

/** Swaps the engine client in the container; returns the fake and a restore function. */
export function fakeContextEngine() {
  const fake = new FakeContextEngine()
  app.container.swap(ContextEngineClient, () => fake)
  return { fake, restore: () => app.container.restore(ContextEngineClient) }
}
