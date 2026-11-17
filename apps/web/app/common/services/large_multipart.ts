import { createWriteStream } from 'node:fs'
import { unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'

import string from '@adonisjs/core/helpers/string'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * Processes the multipart body of a route listed in the bodyparser's `processManually`,
 * with its own size limit, the way auto-processing would: files land in tmp files and
 * `request.file()` / `validateUsing` work as usual inside `handler`. The tmp files are
 * deleted afterwards, so `handler` must be done with them when it returns.
 */
export async function withLargeMultipart<T>(
  request: HttpContext['request'],
  limit: string,
  handler: () => Promise<T>
): Promise<T> {
  const tmpPaths: string[] = []

  request.multipart.onFile('*', { deferValidations: true }, async (part, reportChunk) => {
    const tmpPath = join(tmpdir(), string.uuid())
    tmpPaths.push(tmpPath)
    await pipeline(
      part,
      new Transform({
        transform(chunk, _encoding, callback) {
          Promise.resolve(reportChunk(chunk)).then(
            () => callback(null, chunk),
            (error) => callback(error)
          )
        },
      }),
      createWriteStream(tmpPath)
    )
    return { tmpPath }
  })

  try {
    await request.multipart.process({ limit })
    return await handler()
  } finally {
    await Promise.all(tmpPaths.map((path) => unlink(path).catch(() => {})))
  }
}
