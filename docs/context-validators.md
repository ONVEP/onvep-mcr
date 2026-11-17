# Context validators — reference

Use this document to write **validators** for the context engine: JSON Schemas attached to context paths, which reject invalid updates. Everything needed to produce a correct one on the first try is here. Derived values and input cleanup belong in mutators (`context-mutators.md`).

Read `context.md` first: paths, writes, the update pipeline and the triggering rule are described there.

A validator is a **JSON Schema** attached to a context path. After mutators have run, every validator touched by the write checks the value at its path. If any fails, the write is rejected with **all** failures listed.

## 1. Definition

| Field     | Content                                                                                 |
| --------- | --------------------------------------------------------------------------------------- |
| `path`    | Context path, `*` allowed (`teams.*` validates every team). `""` validates the root. One validator per path. |
| `schema`  | A JSON Schema object (draft-07, via Ajv).                                               |
| `enabled` | Disabled validators are kept but not applied.                                           |

## 2. When it runs

- Only when a change of the write is related to its path (see "Triggering rule" in `context.md`).
- Against the **final** context, mutator output included. A validator can therefore check derived fields, and a mutator can fix input before validation.
- With `*`, the path is expanded against the keys and indexes that exist. Every match is validated; a pattern that matches nothing validates nothing.

## 3. Schema rules

- Ajv is configured with `allErrors`, formats from `ajv-formats` and **strict mode**: an unknown keyword (a typo such as `minLenght`) is **rejected on save** rather than silently ignored.
- Invalid schemas, invalid paths and duplicate paths are rejected on save.
- The validator UI is a visual builder that edits this subset of keywords, and a schema can be pasted into it as JSON:
  - `type`: `string`, `number`, `integer`, `boolean`, `object`, `array`, `null`, or none (anything). Nullable is written `["string", "null"]`.
  - strings: `minLength`, `maxLength`, `pattern`, `format` (`email`, `uri`, `date-time`, `date`, `time`, `uuid`, `hostname`, `ipv4`), `enum`;
  - numbers: `minimum`, `maximum`, `enum`;
  - arrays: `items`, `minItems`, `maxItems`;
  - objects: `properties`, `required`, `additionalProperties`.
- The engine accepts any draft-07 keyword (`oneOf`, `const`, `$defs`…) through its API, but **stick to the subset above** so the schema stays editable in the UI.

## 4. Pitfalls

- **Deleting a validated path.** A validator on a concrete path (no `*`) also runs when that path is deleted. The value is then missing, and a `type` rule fails (`must be object`): the deletion is refused. If the subtree may legitimately disappear, validate it from its parent instead (an optional property of the parent's schema), or with a wildcard path.
- **Overlapping validators.** `match` and `match.home` both run when `match.home.score` changes. Keep one rule in one place.
- **Strict object shapes.** `additionalProperties: false` also rejects keys added by mutators. List them in `properties`, or leave `additionalProperties` out.
- **Validators don't coerce.** `"2"` is not an `integer`. Fix the writer, or normalize in a mutator (which runs first).

## 5. Error shape

A rejected write answers `422`:

```json
{
  "code": "E_CONTEXT_VALIDATION",
  "message": "The updated context does not satisfy its validators",
  "errors": [
    { "path": "teams.2", "field": "teams.2.score", "message": "must be integer", "rule": "type" }
  ]
}
```

`path` is the concrete path the validator ran on; `field` points at the failing value (for `required`, the missing property).

## 6. Examples

### 1 — Lower third

Path: `lowerThird`

```json
{
  "type": "object",
  "properties": {
    "visible": { "type": "boolean" },
    "name": { "type": "string", "maxLength": 60 },
    "title": { "type": ["string", "null"], "maxLength": 80 }
  },
  "required": ["visible", "name"]
}
```

### 2 — Every item of a list

Path: `agenda.items.*`

```json
{
  "type": "object",
  "properties": {
    "time": { "type": "string", "pattern": "^([01]\\d|2[0-3]):[0-5]\\d$" },
    "label": { "type": "string", "minLength": 1, "maxLength": 120 }
  },
  "required": ["time", "label"]
}
```

### 3 — Bounded list with an enum

Path: `match`

```json
{
  "type": "object",
  "properties": {
    "status": { "type": "string", "enum": ["pre", "live", "half-time", "ended"] },
    "teams": {
      "type": "array",
      "minItems": 2,
      "maxItems": 2,
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string", "minLength": 1 },
          "score": { "type": "integer", "minimum": 0 }
        },
        "required": ["name", "score"]
      }
    }
  },
  "required": ["status", "teams"]
}
```

## 7. Checklist

- [ ] Path uses `*` for collections; one validator per concern.
- [ ] Only keywords from the supported subset; nullable written as `[type, "null"]`.
- [ ] Fields added by mutators are allowed by the schema.
- [ ] Deleting the validated subtree is either impossible by design or validated from the parent.
