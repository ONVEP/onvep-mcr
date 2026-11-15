import env from '#start/env'

import ContextEngineException from '#context/exceptions/context_engine_exception'
import ContextEngineUnavailableException from '#context/exceptions/context_engine_unavailable_exception'
import type {
  ContextMutator,
  ContextMutatorSummary,
  ContextUpdate,
  ContextValidator,
  ContextValidatorDefinition,
  ContextVersion,
  ContextVersionPage,
  JsonValue,
} from '#context/types/engine'

const encodePath = (path: string) => encodeURIComponent(path)
const encodeMutatorName = (name: string) => name.split('/').map(encodeURIComponent).join('/')

/**
 * HTTP client for the context engine. The engine has no authentication:
 * the web app is the only writer and checks permissions before calling it.
 * Resolve it from the container so tests can swap it.
 */
export class ContextEngineClient {
  constructor(private baseUrl: string = env.get('CONTEXT_ENGINE_URL')) {}

  /** URL browsers use to subscribe to the engine's SSE stream */
  static publicUrl() {
    return env.get('CONTEXT_ENGINE_PUBLIC_URL') || env.get('CONTEXT_ENGINE_URL')
  }

  async getValue(path: string) {
    const { value } = await this.#request<{ value: JsonValue }>(
      'GET',
      `/context/${encodePath(path)}`
    )
    return value
  }

  setValue(path: string, value: JsonValue) {
    return this.#request('PUT', `/context/${encodePath(path)}`, { value })
  }

  appendValue(path: string, value: JsonValue) {
    return this.#request('POST', `/context/${encodePath(path)}`, { value })
  }

  removeValue(path: string) {
    return this.#request('DELETE', `/context/${encodePath(path)}`)
  }

  listMutators() {
    return this.#request<ContextMutatorSummary[]>('GET', '/mutators')
  }

  getMutator(name: string) {
    return this.#request<ContextMutator>('GET', `/mutators/${encodeMutatorName(name)}`)
  }

  saveMutator(name: string, source: string) {
    return this.#request<ContextMutatorSummary[]>('PUT', `/mutators/${encodeMutatorName(name)}`, {
      source,
    })
  }

  deleteMutator(name: string) {
    return this.#request<ContextMutatorSummary[]>('DELETE', `/mutators/${encodeMutatorName(name)}`)
  }

  listValidators() {
    return this.#request<ContextValidator[]>('GET', '/validators')
  }

  getValidator(id: number) {
    return this.#request<ContextValidator>('GET', `/validators/${id}`)
  }

  createValidator(definition: ContextValidatorDefinition) {
    return this.#request<ContextValidator>('POST', '/validators', definition)
  }

  updateValidator(id: number, definition: ContextValidatorDefinition) {
    return this.#request<ContextValidator>('PUT', `/validators/${id}`, definition)
  }

  deleteValidator(id: number) {
    return this.#request<null>('DELETE', `/validators/${id}`)
  }

  listVersions(page: number, perPage: number) {
    return this.#request<ContextVersionPage>('GET', `/versions?page=${page}&perPage=${perPage}`)
  }

  getVersion(id: number) {
    return this.#request<ContextVersion>('GET', `/versions/${id}`)
  }

  /** Commits the version's content as a new version (history is append-only). */
  restoreVersion(id: number, bypassMutators: boolean) {
    return this.#request<ContextUpdate>('POST', `/versions/${id}/restore`, { bypassMutators })
  }

  async #request<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
    let response: Response
    try {
      response = await fetch(new URL(path, this.baseUrl), {
        method,
        headers: {
          accept: 'application/json',
          ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
    } catch (error) {
      throw new ContextEngineUnavailableException(`Context engine unreachable at ${this.baseUrl}`, {
        cause: error,
      })
    }

    const payload = response.status === 204 ? null : await response.json().catch(() => null)
    if (!response.ok) {
      throw new ContextEngineException(response.status, payload as ContextEngineException['body'])
    }
    return payload as T
  }
}
