import { test } from '@japa/runner'
import {
  type JsonObject,
  diffPaths,
  expandPattern,
  getAt,
  isRelated,
  mergePatch,
  parsePath,
  setAt,
  unsetAt,
} from '#context/lib/path'
import InvalidPathException from '#context/exceptions/invalid_path_exception'

test.group('context path', () => {
  test('parses dotted paths, empty string being the root', ({ assert }) => {
    assert.deepEqual(parsePath(''), [])
    assert.deepEqual(parsePath('layers.0.name'), ['layers', '0', 'name'])
    assert.throws(() => parsePath('layers..name'), 'Invalid path "layers..name"')
  })

  test('reads nested values through objects and arrays', ({ assert }) => {
    const context = { layers: [{ name: 'test', value: 0 }] }
    assert.equal(getAt(context, ['layers', '0', 'name']), 'test')
    assert.deepEqual(getAt(context, ['layers']), [{ name: 'test', value: 0 }])
    assert.isUndefined(getAt(context, ['layers', '1', 'name']))
    assert.isUndefined(getAt(context, ['layers', 'name']))
  })

  test('creates missing containers on write', ({ assert }) => {
    const context = {}
    setAt(context, ['layers', '0', 'name'], 'test')
    assert.deepEqual(context, { layers: [{ name: 'test' }] })
  })

  test('refuses to write through a primitive or past the end of an array', ({ assert }) => {
    const context = { title: 'x', layers: [] }
    assert.throws(() => setAt(context, ['title', 'a'], 1), InvalidPathException)
    assert.throws(() => setAt(context, ['layers', '2'], 1), InvalidPathException)
    assert.throws(() => setAt(context, ['layers', 'name'], 1), InvalidPathException)
  })

  test('splices array items on unset', ({ assert }) => {
    const context = { layers: ['a', 'b', 'c'], meta: { a: 1 } }
    assert.isTrue(unsetAt(context, ['layers', '1']))
    assert.isTrue(unsetAt(context, ['meta', 'a']))
    assert.isFalse(unsetAt(context, ['meta', 'a']))
    assert.deepEqual(context, { layers: ['a', 'c'], meta: {} })
  })

  test('diffs down to the deepest changed paths', ({ assert }) => {
    const before: JsonObject = { layers: [{ name: 'a', value: 0 }], title: 'x' }
    const after: JsonObject = {
      layers: [{ name: 'b', value: 0 }, { name: 'c' }],
      title: 'x',
      live: true,
    }
    assert.deepEqual(diffPaths(before, after), [['layers', '0', 'name'], ['layers', '1'], ['live']])
    assert.deepEqual(diffPaths(before, structuredClone(before)), [])
  })

  test('relates ancestors, descendants and wildcards', ({ assert }) => {
    assert.isTrue(isRelated(['layers'], ['layers', '0', 'name']))
    assert.isTrue(isRelated(['layers', '0', 'name'], ['layers']))
    assert.isTrue(isRelated([], ['anything']))
    assert.isTrue(isRelated(['layers', '*', 'name'], ['layers', '3', 'name']))
    assert.isFalse(isRelated(['layers', '*', 'name'], ['layers', '3', 'value']))
    assert.isFalse(isRelated(['title'], ['layers']))
  })

  test('expands wildcards against the context', ({ assert }) => {
    const context = { layers: [{ name: 'a' }, { name: 'b' }] }
    assert.deepEqual(expandPattern(context, ['layers', '*', 'name']), [
      ['layers', '0', 'name'],
      ['layers', '1', 'name'],
    ])
    assert.deepEqual(expandPattern(context, ['missing', '*']), [])
  })

  test('applies JSON merge patch semantics', ({ assert }) => {
    assert.deepEqual(mergePatch({ a: 1, b: { c: 2, d: 3 } }, { a: null, b: { c: 4 }, e: [1] }), {
      b: { c: 4, d: 3 },
      e: [1],
    })
    assert.equal(mergePatch({ a: 1 }, 'scalar'), 'scalar')
  })
})
