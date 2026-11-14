import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'

import { __unstable__loadDesignSystem } from 'tailwindcss'

const require = createRequire(import.meta.url)

let cached: Promise<string[]> | null = null

/**
 * Every utility class of the installed Tailwind version, for editor autocompletion.
 * Built once per process: it comes from the same package as the CG runtime, so the
 * suggestions always match what /cg pages can render.
 */
export function tailwindClassList(): Promise<string[]> {
  cached ??= __unstable__loadDesignSystem('@import "tailwindcss";', {
    base: path.dirname(require.resolve('tailwindcss/package.json')),
    loadStylesheet: async (id, base) => {
      const file = id.startsWith('.') ? path.resolve(base, id) : require.resolve(`${id}/index.css`)
      return { path: file, base: path.dirname(file), content: await readFile(file, 'utf8') }
    },
  }).then((design) => design.getClassList().map(([name]) => name))

  return cached
}
