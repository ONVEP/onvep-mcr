/**
 * Shapes returned by the context engine API (apps/context-engine). Shared by
 * the HTTP client and the Inertia pages.
 */

export type JsonPrimitive = null | boolean | number | string
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }
export type JsonObject = { [key: string]: JsonValue }

export type ContextMutatorSummary = {
  name: string
  subscriptions: string[]
  /** Disabled mutators are kept but never run */
  enabled: boolean
}

export type ContextMutator = ContextMutatorSummary & {
  source: string
}

/** JSON Schema, as edited by the schema builder */
export type JsonSchema = { [key: string]: JsonValue }

export type ContextValidator = {
  id: number
  path: string
  schema: JsonSchema
  /** Disabled validators are kept but not applied */
  enabled: boolean
  createdAt: string
  updatedAt: string
}

/** `enabled` omitted: enabled on create, unchanged on update */
export type ContextValidatorDefinition = Pick<ContextValidator, 'path' | 'schema'> &
  Partial<Pick<ContextValidator, 'enabled'>>

export type ContextVersionSummary = {
  id: number
  createdAt: string
}

export type ContextVersion = ContextVersionSummary & {
  context: JsonObject
}

export type ContextVersionPage = {
  meta: { total: number; perPage: number; currentPage: number; lastPage: number }
  data: ContextVersionSummary[]
}

export type ContextUpdate = {
  changes: string[]
  /** Absent when the update left the live context unchanged */
  version?: number
}
