import type { JsonObject, JsonValue } from '#context/types/engine'

export type JsonKind = 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array'

export function kindOf(value: JsonValue): JsonKind {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value as JsonKind
}

export function isContainer(value: JsonValue | undefined): value is JsonObject | JsonValue[] {
  return typeof value === 'object' && value !== null
}

/** Same dotted notation as the engine: "layers.0.name", "" for the root. */
export function joinPath(parent: string, key: string | number) {
  return parent === '' ? String(key) : `${parent}.${key}`
}

export function parentPath(path: string) {
  const index = path.lastIndexOf('.')
  return index === -1 ? '' : path.slice(0, index)
}

export function lastSegment(path: string) {
  return path.slice(path.lastIndexOf('.') + 1)
}

export function getAt(root: JsonValue, path: string): JsonValue | undefined {
  if (path === '') return root
  let current: JsonValue | undefined = root
  for (const segment of path.split('.')) {
    if (!isContainer(current)) return undefined
    current = Array.isArray(current)
      ? current[Number(segment)]
      : Object.hasOwn(current, segment)
        ? current[segment]
        : undefined
  }
  return current
}

export function children(value: JsonObject | JsonValue[]): [string, JsonValue][] {
  return Array.isArray(value) ? value.map((item, i) => [String(i), item]) : Object.entries(value)
}

/** Deep equality, ignoring key order: Postgres jsonb doesn't keep it, so values read back differ. */
export function sameJson(a: JsonValue | undefined, b: JsonValue | undefined): boolean {
  if (a === b) return true
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false
  if (Array.isArray(a) || Array.isArray(b)) {
    return (
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((item, index) => sameJson(item, b[index]))
    )
  }
  const keys = Object.keys(a)
  return (
    keys.length === Object.keys(b).length &&
    keys.every((key) => Object.hasOwn(b, key) && sameJson(a[key], b[key]))
  )
}
