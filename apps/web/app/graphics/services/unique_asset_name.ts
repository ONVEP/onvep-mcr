import { extname } from 'node:path'

import string from '@adonisjs/core/helpers/string'

import Asset from '#graphics/models/asset'

/** URL-safe name from the uploaded filename, suffixed -2, -3… until no other asset uses it. */
export async function uniqueAssetName(clientName: string): Promise<string> {
  const ext = extname(clientName).toLowerCase()
  const base =
    string.slug(clientName.slice(0, -ext.length || undefined), { lower: true, strict: true }) ||
    'asset'

  const rows = await Asset.query()
    .where('name', `${base}${ext}`)
    .orWhereLike('name', `${base}-%${ext}`)
    .select('name')
  const taken = new Set(rows.map((asset) => asset.name))

  if (!taken.has(`${base}${ext}`)) return `${base}${ext}`
  let suffix = 2
  while (taken.has(`${base}-${suffix}${ext}`)) suffix++
  return `${base}-${suffix}${ext}`
}
