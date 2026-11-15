import { Ajv, type ErrorObject, type ValidateFunction } from 'ajv'
import ajvFormats from 'ajv-formats'
import ContextValidationException, {
  type ContextValidationError,
} from '#context/exceptions/context_validation_exception'
import type InvalidPathException from '#context/exceptions/invalid_path_exception'
import InvalidValidatorException from '#context/exceptions/invalid_validator_exception'
import ValidatorNotFoundException from '#context/exceptions/validator_not_found_exception'
import type { JsonObject, PathSegments } from '#context/lib/path'
import {
  expandPattern,
  formatPath,
  getAt,
  isPlainObject,
  isRelated,
  parsePath,
} from '#context/lib/path'
import ContextValidator from '#context/models/context_validator'

export type ValidatorDefinition = {
  path: string
  schema: JsonObject
}

type CompiledValidator = {
  pattern: PathSegments
  validate: ValidateFunction
}

// ajv-formats is CommonJS: its default import is typed as the module namespace.
const addFormats = ajvFormats as unknown as typeof ajvFormats.default

function createAjv() {
  // Unknown keywords are rejected so a typo doesn't silently disable a rule.
  const ajv = new Ajv({ allErrors: true, allowUnionTypes: true, strictTypes: false })
  addFormats(ajv)
  return ajv
}

/**
 * `/layers/0/name` → `layers.0.name`. `required` errors point at the parent
 * object, so the missing property is appended.
 */
function errorField(error: ErrorObject) {
  const segments = error.instancePath
    .split('/')
    .slice(1)
    .map((segment) => segment.replaceAll('~1', '/').replaceAll('~0', '~'))
  if (error.keyword === 'required') segments.push(error.params.missingProperty)
  return segments.join('.')
}

/**
 * JSON Schema validators, stored in the database and keyed by context path
 * (`*` matches any key/index, e.g. `layers.*`).
 */
export class ValidatorRegistry {
  #validators: CompiledValidator[] = []

  async reload() {
    const rows = await ContextValidator.query().orderBy('path')
    const ajv = createAjv()
    this.#validators = rows.map((row) => ({
      pattern: parsePath(row.path),
      validate: ajv.compile(row.schema),
    }))
  }

  list() {
    return ContextValidator.query().orderBy('path')
  }

  async find(id: number) {
    const validator = await ContextValidator.find(id)
    if (!validator) throw new ValidatorNotFoundException(id)
    return validator
  }

  async create(definition: ValidatorDefinition) {
    await this.#check(definition)
    const validator = await ContextValidator.create(definition)
    await this.reload()
    return validator
  }

  async update(id: number, definition: ValidatorDefinition) {
    const validator = await this.find(id)
    await this.#check(definition, id)
    await validator.merge(definition).save()
    await this.reload()
    return validator
  }

  async delete(id: number) {
    const validator = await this.find(id)
    await validator.delete()
    await this.reload()
  }

  async #check({ path, schema }: ValidatorDefinition, exceptId?: number) {
    try {
      parsePath(path)
    } catch (error) {
      throw new InvalidValidatorException((error as InvalidPathException).message)
    }
    if (!isPlainObject(schema)) {
      throw new InvalidValidatorException('The schema must be a JSON object')
    }
    try {
      createAjv().compile(schema)
    } catch (error) {
      throw new InvalidValidatorException(`Invalid JSON Schema: ${(error as Error).message}`)
    }

    const duplicate = await ContextValidator.query()
      .where('path', path)
      .if(exceptId, (query) => query.whereNot('id', exceptId!))
      .first()
    if (duplicate) {
      throw new InvalidValidatorException(`A validator already exists for path "${path}"`)
    }
  }

  /**
   * Runs every validator whose path is touched by `changes` against
   * `context`, and throws once with all failures collected.
   */
  validate(context: JsonObject, changes: PathSegments[]) {
    const failures: ContextValidationError[] = []

    for (const { pattern, validate } of this.#validators) {
      if (!changes.some((change) => isRelated(pattern, change))) continue

      for (const path of expandPattern(context, pattern)) {
        if (validate(getAt(context, path))) continue
        for (const error of validate.errors ?? []) {
          failures.push({
            path: formatPath(path),
            field: errorField(error),
            message: error.message ?? 'is invalid',
            rule: error.keyword,
          })
        }
      }
    }

    if (failures.length) throw new ContextValidationException(failures)
  }
}
