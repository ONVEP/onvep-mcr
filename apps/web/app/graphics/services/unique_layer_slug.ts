import string from '@adonisjs/core/helpers/string'

import Layer from '#graphics/models/layer'

/** Slug derived from the name, suffixed -2, -3… until no other layer uses it. */
export async function uniqueLayerSlug(name: string): Promise<string> {
  const base = string.slug(name, { lower: true, strict: true }) || 'layer'

  const rows = await Layer.query()
    .where('slug', base)
    .orWhereLike('slug', `${base}-%`)
    .select('slug')
  const taken = new Set(rows.map((layer) => layer.slug))

  if (!taken.has(base)) return base
  let suffix = 2
  while (taken.has(`${base}-${suffix}`)) suffix++
  return `${base}-${suffix}`
}
