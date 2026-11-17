import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

import CssVariable from '#graphics/models/css_variable'
import CustomCss from '#graphics/models/custom_css'
import Layer from '#graphics/models/layer'
import { reloadCgPages } from '#graphics/services/cg_live_reload'
import NetworkDrive from '#media/models/network_drive'
import Rundown from '#rundowns/models/rundown'
import Step from '#rundowns/models/step'
import StepType from '#rundowns/models/step_type'
import { isPermission } from '#users/enums/permission'
import { ROLES } from '#users/enums/role'
import Role from '#users/models/role'
import type { ContextEngineClient } from '#context/services/context_engine_client'
import type { JsonObject } from '#context/types/engine'
import type {
  BundleStepType,
  TransferBundle,
  TransferMode,
  TransferReport,
  TransferSelection,
} from '#transfer/types/bundle'

export interface ImportBundleInput {
  bundle: TransferBundle
  /** Item keys are positions in the bundle's arrays */
  selection: TransferSelection
  mode: TransferMode
}

/** Keeps the selected entries of a bundle array, in file order. */
function pick<T>(items: T[] | undefined, keys: string[] | undefined): T[] {
  if (!items || !keys) return []
  const wanted = new Set(keys)
  return items.filter((_, index) => wanted.has(String(index)))
}

/**
 * Imports the selected parts of a bundle. Existing records are matched by their
 * natural key (name, slug, path) and, depending on `mode`, overwritten or left
 * untouched. Singletons (custom CSS, context data) only count as existing when
 * they have content.
 *
 * Database records are imported in one transaction. The context engine can't
 * join it: it runs afterwards, validators and mutators first so the data goes
 * through them.
 */
export default class ImportBundle {
  #report: TransferReport = { created: 0, updated: 0, skipped: 0 }

  constructor(private engine: ContextEngineClient) {}

  async handle({ bundle, selection, mode }: ImportBundleInput): Promise<TransferReport> {
    const { collections: keys, singletons } = selection
    const overwrite = mode === 'overwrite'

    const graphicsChanged = await db.transaction(async (trx) => {
      await this.#stepTypes(
        trx,
        pick(bundle.rundowns?.stepTypes, keys['rundowns.stepTypes']),
        overwrite
      )
      await this.#rundowns(
        trx,
        pick(bundle.rundowns?.rundowns, keys['rundowns.rundowns']),
        overwrite
      )
      await this.#networkDrives(
        trx,
        pick(bundle.media?.networkDrives, keys['media.networkDrives']),
        overwrite
      )
      await this.#roles(trx, pick(bundle.users?.roles, keys['users.roles']), overwrite)

      const before = this.#report.created + this.#report.updated
      await this.#layers(trx, pick(bundle.graphics?.layers, keys['graphics.layers']), overwrite)
      await this.#cssVariables(
        trx,
        pick(bundle.graphics?.cssVariables, keys['graphics.cssVariables']),
        overwrite
      )
      if (singletons.includes('graphics.customCss') && bundle.graphics?.customCss !== undefined) {
        await this.#customCss(trx, bundle.graphics.customCss, overwrite)
      }
      return this.#report.created + this.#report.updated > before
    })
    if (graphicsChanged) reloadCgPages()

    await this.#validators(pick(bundle.context?.validators, keys['context.validators']), overwrite)
    await this.#mutators(pick(bundle.context?.mutators, keys['context.mutators']), overwrite)
    if (singletons.includes('context.data') && bundle.context?.data !== undefined) {
      await this.#contextData(bundle.context.data as JsonObject, overwrite)
    }

    return this.#report
  }

  /**
   * Creates the record when missing, else updates it when overwriting.
   * Returns the record that ends up in the database, or null when skipped.
   */
  async #upsert<T>(
    existing: T | null,
    overwrite: boolean,
    create: () => Promise<T | unknown>,
    update: (row: T) => Promise<unknown>
  ): Promise<T | null> {
    if (!existing) {
      this.#report.created++
      return (await create()) as T
    }
    if (!overwrite) {
      this.#report.skipped++
      return null
    }
    await update(existing)
    this.#report.updated++
    return existing
  }

  async #stepTypes(trx: TransactionClientContract, rows: BundleStepType[], overwrite: boolean) {
    for (const row of rows) {
      const existing = await StepType.query({ client: trx }).where('name', row.name).first()
      await this.#upsert(
        existing,
        overwrite,
        () => StepType.create({ name: row.name, color: row.color.toLowerCase() }, { client: trx }),
        (target) => target.merge({ color: row.color.toLowerCase() }).save()
      )
    }
  }

  async #rundowns(
    trx: TransactionClientContract,
    rows: NonNullable<NonNullable<TransferBundle['rundowns']>['rundowns']>,
    overwrite: boolean
  ) {
    // Steps reference their type by name: reuse the local one, or create it from the file.
    const stepTypeIds = new Map<string, number>()
    const stepTypeId = async ({ name, color }: BundleStepType) => {
      if (!stepTypeIds.has(name)) {
        const type =
          (await StepType.query({ client: trx }).where('name', name).first()) ??
          (await StepType.create({ name, color: color.toLowerCase() }, { client: trx }))
        stepTypeIds.set(name, type.id)
      }
      return stepTypeIds.get(name)!
    }

    for (const row of rows) {
      // Rundown names aren't unique: the first one with the name is the match.
      const existing = await Rundown.query({ client: trx })
        .where('name', row.name)
        .orderBy('id')
        .first()
      const rundown = await this.#upsert(
        existing,
        overwrite,
        () => Rundown.create({ name: row.name, startTime: row.startTime }, { client: trx }),
        async (target) => {
          await target.merge({ startTime: row.startTime }).save()
          await Step.query({ client: trx }).where('rundown_id', target.id).delete()
        }
      )
      if (!rundown) continue

      for (const [index, step] of row.steps.entries()) {
        await Step.create(
          {
            rundownId: rundown.id,
            order: index + 1,
            title: step.title,
            stepTypeId: await stepTypeId(step.stepType),
            plannedDuration: step.plannedDuration,
            playedTime: step.playedTime,
            waitUntil: step.waitUntil,
            autoNext: step.autoNext,
          },
          { client: trx }
        )
      }
    }
  }

  async #networkDrives(
    trx: TransactionClientContract,
    rows: NonNullable<NonNullable<TransferBundle['media']>['networkDrives']>,
    overwrite: boolean
  ) {
    for (const row of rows) {
      const existing = await NetworkDrive.query({ client: trx }).where('name', row.name).first()
      await this.#upsert(
        existing,
        overwrite,
        () => NetworkDrive.create(row, { client: trx }),
        (target) => target.merge(row).save()
      )
    }
  }

  async #roles(
    trx: TransactionClientContract,
    rows: NonNullable<NonNullable<TransferBundle['users']>['roles']>,
    overwrite: boolean
  ) {
    for (const row of rows) {
      const permissions = Array.from(new Set(row.permissions.filter(isPermission)))
      const existing = await Role.query({ client: trx }).where('name', row.name).first()
      // Admin always holds every permission (see RolePolicy): an import can't change it.
      if (existing?.name === ROLES.ADMIN) {
        this.#report.skipped++
        continue
      }
      await this.#upsert(
        existing,
        overwrite,
        () => Role.create({ name: row.name, permissions }, { client: trx }),
        (target) => target.merge({ permissions }).save()
      )
    }
  }

  async #layers(
    trx: TransactionClientContract,
    rows: NonNullable<NonNullable<TransferBundle['graphics']>['layers']>,
    overwrite: boolean
  ) {
    for (const row of rows) {
      // The slug is the key: playout software points at /cg/layer/:slug.
      const existing = await Layer.query({ client: trx }).where('slug', row.slug).first()
      await this.#upsert(
        existing,
        overwrite,
        () => Layer.create(row, { client: trx }),
        (target) =>
          target.merge({ name: row.name, enabled: row.enabled, content: row.content }).save()
      )
    }
  }

  async #cssVariables(
    trx: TransactionClientContract,
    rows: NonNullable<NonNullable<TransferBundle['graphics']>['cssVariables']>,
    overwrite: boolean
  ) {
    for (const row of rows) {
      const existing = await CssVariable.query({ client: trx }).where('name', row.name).first()
      await this.#upsert(
        existing,
        overwrite,
        () => CssVariable.create(row, { client: trx }),
        (target) => target.merge({ kind: row.kind, value: row.value }).save()
      )
    }
  }

  async #customCss(trx: TransactionClientContract, content: string, overwrite: boolean) {
    const row = await CustomCss.query({ client: trx }).orderBy('id').first()
    await this.#upsert(
      row?.content ? row : null,
      overwrite,
      () => {
        const target = row ?? new CustomCss()
        target.useTransaction(trx)
        target.content = content
        return target.save()
      },
      (target) => target.merge({ content }).save()
    )
  }

  async #validators(
    rows: NonNullable<NonNullable<TransferBundle['context']>['validators']>,
    overwrite: boolean
  ) {
    if (rows.length === 0) return
    const current = await this.engine.listValidators()
    const existing = new Map(current.map((row) => [row.path, row]))
    for (const row of rows) {
      await this.#upsert(
        existing.get(row.path) ?? null,
        overwrite,
        () => this.engine.createValidator({ ...row, enabled: row.enabled ?? true }),
        (target) => this.engine.updateValidator(target.id, { ...row, enabled: row.enabled ?? true })
      )
    }
  }

  async #mutators(
    rows: NonNullable<NonNullable<TransferBundle['context']>['mutators']>,
    overwrite: boolean
  ) {
    if (rows.length === 0) return
    const current = await this.engine.listMutators()
    const existing = new Set(current.map((row) => row.name))
    for (const row of rows) {
      await this.#upsert(
        existing.has(row.name) ? row.name : null,
        overwrite,
        async () => {
          await this.engine.saveMutator(row.name, row.source)
          // New mutators start enabled.
          if (row.enabled === false) await this.engine.setMutatorEnabled(row.name, false)
        },
        async () => {
          // A source update keeps the current state: apply the file's explicitly.
          await this.engine.saveMutator(row.name, row.source)
          await this.engine.setMutatorEnabled(row.name, row.enabled ?? true)
        }
      )
    }
  }

  async #contextData(data: JsonObject, overwrite: boolean) {
    const current = await this.engine.getValue('')
    const hasContent = Boolean(current) && Object.keys(current as object).length > 0
    await this.#upsert(
      hasContent ? current : null,
      overwrite,
      () => this.engine.setValue('', data),
      () => this.engine.setValue('', data)
    )
  }
}
