# Context mutators — reference

Use this document to write **mutators** for the context engine: JavaScript modules that transform the context on every update. Everything needed to produce a correct one on the first try is here. Shape rules belong in validators (`context-validators.md`).

Read `context.md` first: paths, writes, the update pipeline and the triggering rule are described there.

A mutator is a JavaScript module that receives the context before and after a write, and returns the context to commit. Use it to **derive** values (formatted strings, totals, sorted lists, flags), **normalize** input, or **keep parts of the context in sync**.

## 1. Shape

```js
// Runs when one of these context paths changes ("*" matches any key or index).
export const subscriptions = ['match.home.score', 'match.away.score']

/**
 * @param oldContext the committed context (read-only)
 * @param newContext the context being updated
 * @returns the context to commit
 */
export default function (oldContext, newContext) {
  newContext.match.leader = /* … */
  return newContext
}
```

- `subscriptions`: **required**, an array of path patterns. An empty array means the mutator never runs.
- Default export: **required**, a function `(oldContext, newContext)`. It may be `async`.
- It must **return the whole context** as a plain object, usually `newContext` after modifying it. Returning anything else (`undefined`, an array, a sub-object) fails the write.

## 2. Arguments

- `oldContext` is the committed context, **deep-frozen**. Writing to it throws (modules run in strict mode) and fails the write. Use it to compare: "what was the score before?".
- `newContext` is a private copy of the context being built. It already includes the write and the output of mutators that ran before. Modify it freely.
- Neither argument is ever `undefined`, but any path inside may be missing. Guard with optional chaining: `newContext.match?.home?.score ?? 0`.

## 3. Execution

- Only **enabled** mutators run. A disabled mutator stays listed and editable.
- They run in **name order** (alphabetical, folders included). Prefix names to control the order: `10-normalize.js`, `50-derive/score.js`.
- A mutator runs when one of its subscriptions matches what changed **since it last ran** (or since the committed context, for its first run in this write). As a result:
  - it **never re-triggers itself** with its own output;
  - it **does react to other mutators**, earlier or later in the order. The engine runs passes until no mutator is triggered anymore.
- Two mutators that keep changing what the other subscribes to form a **loop**. Past 10 passes (default, `MAX_MUTATOR_PASSES`), the write is aborted with the names of the looping mutators.
- Writes are processed one at a time: a slow mutator (network call, heavy computation) delays **every** write. Keep them fast.
- Restoring a version may bypass mutators. A plain write never does.

## 4. Output normalization

The result is passed through `JSON.parse(JSON.stringify(…))`:

- keys set to `undefined` disappear: an easy way to remove a key is `delete newContext.x` or `newContext.x = undefined`;
- a `Date` becomes its ISO string;
- `NaN` and `Infinity` become `null`;
- functions, `Map`, `Set` and class instances don't survive. Write plain JSON only.

## 5. Module environment

- Mutators are ES modules running in the engine's Node.js process (full trust, no sandbox).
- They may only import **`node:` builtins** (`import { createHash } from 'node:crypto'`). Relative imports and npm packages are not available. Global `fetch` exists but is rarely a good idea (see Execution, §3).
- Module-level state persists between runs until mutators are reloaded (any save or deletion reloads them all). Don't rely on it for anything important: derive from the context instead.
- File names: letters, digits, `_`, `-`, folders separated by `/`, ending in `.js` or `.mjs` (`.js` is added if omitted). A source that fails to import or doesn't have the right exports is rejected on save, so a broken mutator never replaces a working one.

## 6. Writing good mutators

- **Idempotent and minimal.** Only assign when the value actually differs. An unchanged result triggers nothing, which is what stops passes.
- **Subscribe narrowly.** `match.*.score` rather than `match` if the mutator only reads scores. Subscribing to a path the mutator itself writes is harmless (it doesn't re-trigger itself), but subscribing to the root `""` runs it on every write.
- **Don't fight the user.** If a mutator overwrites a field that people edit by hand, their edit disappears. Derive into separate keys (`titleUpper`, `display.*`) rather than rewriting inputs, unless normalizing input is the goal.
- **Throw to refuse.** `throw new Error('…')` aborts the write and reports the message with the mutator name. For shape rules, prefer a validator.
- **Remember array shifts.** A deletion splices arrays: indexes after it change, so code keyed by index can point at the wrong item.

## 7. Examples

### 1 — Derived field

```js
export const subscriptions = ['match.home.score', 'match.away.score']

export default function (oldContext, newContext) {
  const match = newContext.match
  if (!match?.home || !match?.away) return newContext
  const leader =
    match.home.score > match.away.score ? 'home' : match.away.score > match.home.score ? 'away' : null
  match.home.isLeader = leader === 'home'
  match.away.isLeader = leader === 'away'
  return newContext
}
```

`isLeader` booleans pair well with `ctx-show` in a layer.

### 2 — Normalize input

```js
export const subscriptions = ['lowerThird.name', 'lowerThird.title']

export default function (oldContext, newContext) {
  const lt = newContext.lowerThird
  if (!lt) return newContext
  for (const key of ['name', 'title']) {
    if (typeof lt[key] === 'string') lt[key] = lt[key].trim().replace(/\s+/g, ' ')
  }
  return newContext
}
```

### 3 — React to a transition (old vs new)

```js
// Records when the lower third was last shown.
export const subscriptions = ['lowerThird.visible']

export default function (oldContext, newContext) {
  const was = oldContext.lowerThird?.visible === true
  const is = newContext.lowerThird?.visible === true
  if (is && !was) newContext.lowerThird.shownAt = new Date().toISOString()
  return newContext
}
```

### 4 — Sorted copy for display

```js
export const subscriptions = ['results.teams']

export default function (oldContext, newContext) {
  const teams = newContext.results?.teams
  if (!Array.isArray(teams)) return newContext
  newContext.results.ranking = [...teams]
    .sort((a, b) => (b.pts ?? 0) - (a.pts ?? 0))
    .map((team, index) => ({ ...team, rank: index + 1 }))
  return newContext
}
```

Writes go to `results.teams`; layers read `results.ranking`. The input is never rewritten.

### 5 — Cap a list

```js
export const subscriptions = ['ticker.items']

export default function (oldContext, newContext) {
  const items = newContext.ticker?.items
  if (Array.isArray(items) && items.length > 20) newContext.ticker.items = items.slice(-20)
  return newContext
}
```

## 8. Checklist

- [ ] `export const subscriptions = [...]`, narrow paths, no root subscription without reason.
- [ ] Default export returns the **whole** context as a plain object.
- [ ] `oldContext` never written to; optional chaining on every read.
- [ ] Only assigns when the value differs; no two mutators feeding each other forever.
- [ ] Derived values in their own keys rather than overwriting inputs.
- [ ] Only `node:` imports; fast, no network in the hot path.
- [ ] Name prefixed if order matters.
