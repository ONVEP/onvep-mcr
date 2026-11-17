import { BUNDLE_MANIFEST } from '#transfer/types/bundle'

const BLOCK = 512
const decoder = new TextDecoder()

function field(header: Uint8Array, start: number, length: number) {
  const raw = header.subarray(start, start + length)
  const end = raw.indexOf(0)
  return decoder.decode(end === -1 ? raw : raw.subarray(0, end)).trim()
}

/**
 * Reads the manifest from the head of an export archive (a tar, manifest first)
 * without loading the rest: the file can weigh gigabytes. Null when it isn't one.
 */
export async function readArchiveManifest(file: File): Promise<unknown> {
  let offset = 0
  // A few pax headers at most may precede the manifest.
  for (let i = 0; i < 4 && offset + BLOCK <= file.size; i++) {
    const header = new Uint8Array(await file.slice(offset, offset + BLOCK).arrayBuffer())
    const size = Number.parseInt(field(header, 124, 12) || '0', 8)
    const type = String.fromCharCode(header[156])
    if (!Number.isFinite(size)) return null
    offset += BLOCK
    if (type === 'x' || type === 'g') {
      offset += Math.ceil(size / BLOCK) * BLOCK
      continue
    }
    if (field(header, 0, 100) !== BUNDLE_MANIFEST) return null
    return JSON.parse(await file.slice(offset, offset + size).text())
  }
  return null
}
