import InvalidPathException from '#context/exceptions/invalid_path_exception'

export type JsonPrimitive = null | boolean | number | string
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }
export type JsonObject = { [key: string]: JsonValue }

export type PathSegments = string[]

export const WILDCARD = '*'

const INDEX_PATTERN = /^(0|[1-9]\d*)$/

export function isPlainObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isIndex(segment: string) {
  return INDEX_PATTERN.test(segment)
}

/**
 * "layers.0.name" → ["layers", "0", "name"]. The empty string is the root.
 */
export function parsePath(path: string): PathSegments {
  if (path === '') return []
  const segments = path.split('.')
  if (segments.some((segment) => segment === '')) {
    throw new InvalidPathException(`Invalid path "${path}"`)
  }
  return segments
}

export function formatPath(segments: PathSegments): string {
  return segments.join('.')
}

export function getAt(root: JsonValue, segments: PathSegments): JsonValue | undefined {
  let current: JsonValue | undefined = root
  for (const segment of segments) {
    if (Array.isArray(current)) {
      current = isIndex(segment) ? current[Number(segment)] : undefined
    } else if (isPlainObject(current)) {
      current = Object.hasOwn(current, segment) ? current[segment] : undefined
    } else {
      return undefined
    }
  }
  return current
}

/**
 * Walks to the parent of the last segment, creating missing containers
 * (an array when the next segment is an index, an object otherwise).
 */
function resolveParent(root: JsonObject, segments: PathSegments, create: boolean) {
  let current: JsonValue = root
  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i]
    let next = readChild(current, segment, segments)
    if (next === undefined) {
      if (!create) return undefined
      next = isIndex(segments[i + 1]) ? [] : {}
      writeChild(current, segment, next, segments)
    }
    if (!Array.isArray(next) && !isPlainObject(next)) {
      throw new InvalidPathException(
        `Cannot traverse "${formatPath(segments.slice(0, i + 1))}": not an object or array`
      )
    }
    current = next
  }
  return current as JsonObject | JsonValue[]
}

function readChild(container: JsonValue, segment: string, segments: PathSegments) {
  if (Array.isArray(container)) {
    assertIndex(segment, segments)
    return container[Number(segment)]
  }
  return (container as JsonObject)[segment]
}

function writeChild(
  container: JsonValue,
  segment: string,
  value: JsonValue,
  segments: PathSegments
) {
  if (Array.isArray(container)) {
    assertIndex(segment, segments)
    const index = Number(segment)
    // Writing past the end would leave holes, which JSON can't represent.
    if (index > container.length) {
      throw new InvalidPathException(
        `Index ${index} is out of bounds in "${formatPath(segments)}" (length ${container.length})`
      )
    }
    container[index] = value
    return
  }
  ;(container as JsonObject)[segment] = value
}

function assertIndex(segment: string, segments: PathSegments) {
  if (!isIndex(segment)) {
    throw new InvalidPathException(
      `"${segment}" is not a valid array index in "${formatPath(segments)}"`
    )
  }
}

/**
 * Mutates `root` in place. The root itself can't be set through this
 * function: callers replace it directly.
 */
export function setAt(root: JsonObject, segments: PathSegments, value: JsonValue) {
  const parent = resolveParent(root, segments, true)!
  writeChild(parent, segments[segments.length - 1], value, segments)
}

/**
 * Removes the value at `segments`. Array items are spliced out so indexes
 * stay contiguous. Returns false when nothing existed at that path.
 */
export function unsetAt(root: JsonObject, segments: PathSegments): boolean {
  const parent = resolveParent(root, segments, false)
  if (parent === undefined) return false
  const last = segments[segments.length - 1]
  if (Array.isArray(parent)) {
    assertIndex(last, segments)
    const index = Number(last)
    if (index >= parent.length) return false
    parent.splice(index, 1)
    return true
  }
  if (!Object.hasOwn(parent, last)) return false
  delete parent[last]
  return true
}

export function deepEqual(a: JsonValue | undefined, b: JsonValue | undefined): boolean {
  if (a === b) return true
  if (Array.isArray(a)) {
    return Array.isArray(b) && a.length === b.length && a.every((v, i) => deepEqual(v, b[i]))
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const keys = Object.keys(a)
    return (
      keys.length === Object.keys(b).length &&
      keys.every((key) => Object.hasOwn(b, key) && deepEqual(a[key], b[key]))
    )
  }
  return false
}

/**
 * Deepest paths at which `a` and `b` differ. Descends while both sides are
 * containers of the same kind, so a returned path either holds a changed
 * leaf or a subtree that was added, removed or changed type.
 */
export function diffPaths(
  a: JsonValue | undefined,
  b: JsonValue | undefined,
  prefix: PathSegments = []
): PathSegments[] {
  if (a === b) return []
  if (Array.isArray(a) && Array.isArray(b)) {
    const changes: PathSegments[] = []
    const length = Math.max(a.length, b.length)
    for (let i = 0; i < length; i++) {
      changes.push(...diffPaths(a[i], b[i], [...prefix, String(i)]))
    }
    return changes
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const changes: PathSegments[] = []
    const keys = new Set([...Object.keys(a), ...Object.keys(b)])
    for (const key of keys) {
      changes.push(...diffPaths(a[key], b[key], [...prefix, key]))
    }
    return changes
  }
  return deepEqual(a, b) ? [] : [prefix]
}

/**
 * True when one path is an ancestor of (or equal to) the other. `*` in the
 * pattern matches any single segment.
 */
export function isRelated(pattern: PathSegments, path: PathSegments): boolean {
  const length = Math.min(pattern.length, path.length)
  for (let i = 0; i < length; i++) {
    if (pattern[i] !== WILDCARD && pattern[i] !== path[i]) return false
  }
  return true
}

/**
 * Resolves the wildcards of `pattern` against the keys/indexes present in
 * `root`. Concrete segments are kept even when nothing exists there.
 */
export function expandPattern(root: JsonValue, pattern: PathSegments): PathSegments[] {
  const wildcardAt = pattern.indexOf(WILDCARD)
  if (wildcardAt === -1) return [pattern]

  const head = pattern.slice(0, wildcardAt)
  const tail = pattern.slice(wildcardAt + 1)
  const container = getAt(root, head)
  const keys = Array.isArray(container)
    ? container.map((_, i) => String(i))
    : isPlainObject(container)
      ? Object.keys(container)
      : []

  return keys.flatMap((key) => expandPattern(root, [...head, key, ...tail]))
}

/**
 * JSON Merge Patch (RFC 7386): objects merge recursively, `null` removes a
 * key, anything else replaces the target.
 */
export function mergePatch(target: JsonValue | undefined, patch: JsonValue): JsonValue {
  if (!isPlainObject(patch)) return patch
  const result: JsonObject = isPlainObject(target) ? { ...target } : {}
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) {
      delete result[key]
    } else {
      result[key] = mergePatch(result[key], value)
    }
  }
  return result
}
