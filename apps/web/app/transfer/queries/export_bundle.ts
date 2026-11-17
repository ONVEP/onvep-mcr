import Asset from '#graphics/models/asset'
import CssVariable from '#graphics/models/css_variable'
import CustomCss from '#graphics/models/custom_css'
import Layer from '#graphics/models/layer'
import NetworkDrive from '#media/models/network_drive'
import Rundown from '#rundowns/models/rundown'
import StepType from '#rundowns/models/step_type'
import Role from '#users/models/role'
import type { ContextEngineClient } from '#context/services/context_engine_client'
import {
  BUNDLE_FORMAT,
  BUNDLE_VERSION,
  type TransferBundle,
  type TransferSelection,
} from '#transfer/types/bundle'

const ids = (keys: string[] | undefined) => (keys ?? []).map(Number).filter(Number.isInteger)

/** Builds the export file. Only selected nodes appear in it, with only the selected items. */
export default class ExportBundleQuery {
  constructor(private engine: ContextEngineClient) {}

  async handle({ collections, singletons }: TransferSelection): Promise<TransferBundle> {
    const bundle: TransferBundle = {
      format: BUNDLE_FORMAT,
      version: BUNDLE_VERSION,
      exportedAt: new Date().toISOString(),
    }

    const stepTypes = collections['rundowns.stepTypes']
    const rundowns = collections['rundowns.rundowns']
    if (stepTypes || rundowns) {
      bundle.rundowns = {}
      if (stepTypes) {
        const rows = await StepType.query().whereIn('id', ids(stepTypes)).orderBy('name')
        bundle.rundowns.stepTypes = rows.map(({ name, color }) => ({ name, color }))
      }
      if (rundowns) {
        const rows = await Rundown.query()
          .whereIn('id', ids(rundowns))
          .preload('steps', (steps) => steps.preload('stepType').orderBy('order'))
          .orderBy('name')
        bundle.rundowns.rundowns = rows.map((rundown) => ({
          name: rundown.name,
          startTime: rundown.startTime,
          // Steps carry their type by value: the target instance may not have it yet.
          steps: rundown.steps.map((step) => ({
            title: step.title,
            stepType: { name: step.stepType.name, color: step.stepType.color },
            plannedDuration: step.plannedDuration,
            playedTime: step.playedTime,
            waitUntil: step.waitUntil,
            autoNext: step.autoNext,
          })),
        }))
      }
    }

    const networkDrives = collections['media.networkDrives']
    if (networkDrives) {
      const rows = await NetworkDrive.query().whereIn('id', ids(networkDrives)).orderBy('name')
      bundle.media = {
        networkDrives: rows.map(({ name, url, username, password }) => ({
          name,
          url,
          username,
          password,
        })),
      }
    }

    const layers = collections['graphics.layers']
    const cssVariables = collections['graphics.cssVariables']
    const customCss = singletons.includes('graphics.customCss')
    const assets = collections['graphics.assets']
    if (layers || cssVariables || customCss || assets) {
      bundle.graphics = {}
      if (layers) {
        const rows = await Layer.query().whereIn('id', ids(layers)).orderBy('name')
        bundle.graphics.layers = rows.map(({ name, slug, enabled, content }) => ({
          name,
          slug,
          enabled,
          content,
        }))
      }
      if (cssVariables) {
        const rows = await CssVariable.query().whereIn('id', ids(cssVariables)).orderBy('name')
        bundle.graphics.cssVariables = rows.map(({ name, kind, value }) => ({ name, kind, value }))
      }
      if (customCss) {
        const row = await CustomCss.query().orderBy('id').first()
        bundle.graphics.customCss = row?.content ?? ''
      }
      if (assets) {
        // Only the names: the files follow the manifest in the archive.
        const rows = await Asset.query().whereIn('id', ids(assets)).orderBy('name')
        bundle.graphics.assets = rows.map(({ name }) => ({ name }))
      }
    }

    const mutators = collections['context.mutators']
    const validators = collections['context.validators']
    const data = singletons.includes('context.data')
    if (mutators || validators || data) {
      bundle.context = {}
      if (data) {
        bundle.context.data = (await this.engine.getValue('')) as NonNullable<
          TransferBundle['context']
        >['data']
      }
      if (mutators) {
        const names = new Set(mutators)
        const all = await this.engine.listMutators()
        const summaries = all.filter((row) => names.has(row.name))
        bundle.context.mutators = await Promise.all(
          summaries.map(async ({ name, enabled }) => {
            const { source } = await this.engine.getMutator(name)
            return { name, source, enabled }
          })
        )
      }
      if (validators) {
        const keys = new Set(ids(validators))
        const all = await this.engine.listValidators()
        bundle.context.validators = all
          .filter((row) => keys.has(row.id))
          .map(({ path, schema, enabled }) => ({ path, schema, enabled }))
      }
    }

    const roles = collections['users.roles']
    if (roles) {
      const rows = await Role.query().whereIn('id', ids(roles)).orderBy('name')
      bundle.users = { roles: rows.map(({ name, permissions }) => ({ name, permissions })) }
    }

    return bundle
  }
}
