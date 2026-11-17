import { createReadStream } from 'node:fs'
import { Readable } from 'node:stream'

import tar from 'tar-stream'

import Asset from '#graphics/models/asset'
import { BUNDLE_ASSETS_DIR, BUNDLE_MANIFEST, type TransferBundle } from '#transfer/types/bundle'

// The manifest holds no file content: anything bigger isn't one of ours.
const MANIFEST_MAX_SIZE = 50 * 1024 * 1024

/** Streams the export archive: the manifest, then the file of each asset it lists. */
export function packBundle(bundle: TransferBundle): Readable {
  const pack = tar.pack()

  const fill = async () => {
    const manifest = Buffer.from(JSON.stringify(bundle))
    await addEntry(pack, { name: BUNDLE_MANIFEST, size: manifest.length }, [manifest])

    const names = bundle.graphics?.assets?.map(({ name }) => name) ?? []
    const assets = names.length ? await Asset.query().whereIn('name', names).orderBy('name') : []
    for (const asset of assets) {
      await addEntry(
        pack,
        { name: `${BUNDLE_ASSETS_DIR}${asset.name}`, size: asset.file.size },
        (await asset.file.getStream()) as AsyncIterable<Buffer>
      )
    }
    pack.finalize()
  }
  fill().catch((error) => pack.destroy(error))

  return Readable.from(pack)
}

// tar-stream entries are streamx writables, typed apart from node's.
type EntrySink = {
  write(chunk: Buffer): boolean
  end(): void
  once(event: 'drain', listener: () => void): unknown
}

async function addEntry(
  pack: tar.Pack,
  header: { name: string; size: number },
  content: Iterable<Buffer> | AsyncIterable<Buffer>
) {
  let entry!: EntrySink
  const written = new Promise<void>((resolve, reject) => {
    entry = pack.entry(header, (error) =>
      error ? reject(error) : resolve()
    ) as unknown as EntrySink
  })
  for await (const chunk of content) {
    if (!entry.write(chunk))
      await new Promise<void>((resolve) => entry.once('drain', () => resolve()))
  }
  entry.end()
  await written
}

/**
 * Parses the manifest, which must be the archive's first entry.
 * Throws when the file isn't an export archive.
 */
export async function readBundleManifest(path: string): Promise<unknown> {
  const source = createReadStream(path)
  const extract = tar.extract()
  source.pipe(extract)
  try {
    for await (const entry of extract) {
      if (entry.header.name !== BUNDLE_MANIFEST || (entry.header.size ?? 0) > MANIFEST_MAX_SIZE) {
        break
      }
      const chunks: Buffer[] = []
      for await (const chunk of entry) chunks.push(chunk as Buffer)
      return JSON.parse(Buffer.concat(chunks).toString('utf8'))
    }
    throw new Error('Not an export archive')
  } finally {
    source.destroy()
    extract.destroy()
  }
}

/** Calls `onAsset` for each asset file of the archive. What it leaves unread is skipped. */
export async function forEachArchivedAsset(
  path: string,
  onAsset: (name: string, content: AsyncIterable<Buffer>) => Promise<void>
) {
  const source = createReadStream(path)
  const extract = tar.extract()
  source.pipe(extract)
  try {
    for await (const entry of extract) {
      const { name, type } = entry.header
      if (type === 'file' && name.startsWith(BUNDLE_ASSETS_DIR)) {
        await onAsset(name.slice(BUNDLE_ASSETS_DIR.length), entry as AsyncIterable<Buffer>)
      }
      entry.resume()
    }
  } finally {
    source.destroy()
  }
}
