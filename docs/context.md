# Context — common reference

Shared by `context-mutators.md` and `context-validators.md`: what the context is, how it is written to, and when mutators and validators run.

The **context** is a single JSON object held by the context engine. CG layers display it live (see `cg-layers.md`); operators and tools write to it.

## Paths

- Paths are dotted, and array indexes are plain segments: `match.teams.0.name`. The empty path `""` is the root.
- A segment can't be empty: `a..b` is invalid.
- In **subscriptions** (mutators) and **validator paths**, `*` matches any single key or index: `teams.*.score`.

## Writes

Each write targets a path and is one of:

| Operation | Effect                                                                                               |
| --------- | ---------------------------------------------------------------------------------------------------- |
| set       | Replaces the value at the path, creating missing parents.                                             |
| merge     | JSON Merge Patch (RFC 7386) on the value: objects merge recursively, `null` **deletes** a key.        |
| append    | Pushes a value onto the array at the path (creates the array if missing).                            |
| delete    | Removes the value; an array item is spliced out, so later indexes shift down.                        |
| restore   | Makes an old version the live context again (mutators can be bypassed, validators always run).       |

## Pipeline

Every write goes through the same steps, **one write at a time**:

```
operation → mutators → validators → persist (new version) → broadcast to subscribers
```

- If anything throws before persist (a mutator error, a mutator loop, a validation failure), the **whole write is rolled back**. The committed context is never partially updated, and the caller gets the error.
- A write that ends up changing nothing creates no version and notifies no one.
- "Changes" are the **deepest paths whose value differs** between the committed context and the result. Setting `lowerThird` to a new object whose only difference is `name` yields the change `lowerThird.name`.

## Triggering rule (shared by mutators and validators)

A pattern is triggered by a change when one is an **ancestor of, or equal to,** the other (`*` matching any segment). With the pattern `lowerThird`:

| Change                    | Triggered? |
| ------------------------- | ---------- |
| `lowerThird.name`         | yes (descendant) |
| `lowerThird`              | yes        |
| `""` (root replaced)      | yes (ancestor) |
| `lowerThirdBis.name`      | no         |

## Mutator or validator?

| Need                                                   | Use                                         |
| ------------------------------------------------------ | ------------------------------------------- |
| Reject a value of the wrong type, length or format     | Validator                                   |
| Require fields, restrict to a list of values           | Validator                                   |
| Compute a value from others (totals, flags, ranking)   | Mutator                                     |
| Clean up input (trim, case, default values)            | Mutator (runs before validators)            |
| React to a transition (old → new)                      | Mutator (`oldContext` vs `newContext`)      |
| Refuse a write based on a cross-field business rule    | Mutator that throws, or a validator if a schema can express it |
