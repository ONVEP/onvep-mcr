import ContextVersion from '#context/models/context_version'
import type { JsonObject } from '#context/lib/path'

/**
 * Persists every committed context as a new row of `context_versions`:
 * the latest row is the live context, older rows are its history.
 */
export class ContextStore {
  async load(): Promise<JsonObject | null> {
    const latest = await ContextVersion.query().orderBy('id', 'desc').first()
    return latest?.context ?? null
  }

  save(context: JsonObject) {
    return ContextVersion.create({ context })
  }

  /** History without the (potentially large) context payloads, newest first */
  paginate(page: number, perPage: number) {
    return ContextVersion.query()
      .select('id', 'created_at')
      .orderBy('id', 'desc')
      .paginate(page, perPage)
  }

  find(id: number) {
    return ContextVersion.find(id)
  }
}
