import type { Completion, CompletionContext, CompletionResult } from '@codemirror/autocomplete'

import { urlFor } from '~/app/client'

let classes: Promise<Completion[]> | null = null

// Fetched lazily on the first completion inside a class attribute, then kept for the session.
function loadClasses(): Promise<Completion[]> {
  classes ??= fetch(urlFor('graphics.tailwind_classes'), {
    headers: { Accept: 'application/json' },
  })
    .then((response) => (response.ok ? (response.json() as Promise<string[]>) : []))
    .then((list) => list.map((label) => ({ label, type: 'constant' })))
    .catch(() => {
      classes = null
      return []
    })
  return classes
}

const IN_CLASS_ATTRIBUTE = /\bclass\s*=\s*["'][^"']*$/

export async function tailwindCompletion(
  context: CompletionContext
): Promise<CompletionResult | null> {
  const before = context.state.sliceDoc(Math.max(0, context.pos - 2000), context.pos)
  if (!IN_CLASS_ATTRIBUTE.test(before)) return null

  const word = context.matchBefore(/[^\s"']*/)
  if (!word || (word.from === word.to && !context.explicit)) return null

  return { from: word.from, options: await loadClasses(), validFor: /^[^\s"']*$/ }
}
