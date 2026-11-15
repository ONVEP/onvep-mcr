import { useEffect, useRef, useState, type ComponentProps } from 'react'

import { Input } from '@workspace/ui/components/input'
import { cn } from '@workspace/ui/lib/utils'

export const inlineInputClasses =
  'h-7 border-transparent bg-transparent shadow-none hover:border-input dark:bg-transparent'

type InlineInputProps = Omit<ComponentProps<typeof Input>, 'value' | 'onChange'> & {
  value: string
  // Receives a `revert` callback to restore the displayed value when the save fails.
  onCommit: (next: string, revert: () => void) => void
}

// Text input that looks like plain text until hovered/focused; commits on blur or Enter, Escape cancels.
export function InlineInput({ value, onCommit, className, ...props }: InlineInputProps) {
  const [draft, setDraft] = useState(value)

  useEffect(() => setDraft(value), [value])

  return (
    <Input
      {...props}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft !== value) onCommit(draft, () => setDraft(value))
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') setDraft(value)
      }}
      className={cn(inlineInputClasses, className)}
    />
  )
}

// Native color picker: React's onChange fires on every drag move, so commit on the DOM `change`
// event, which only fires once the picker is closed.
export function InlineColorInput({
  value,
  onCommit,
  ariaLabel,
}: {
  value: string
  onCommit: (next: string) => void
  ariaLabel: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState(value)
  const commitRef = useRef(onCommit)
  commitRef.current = onCommit

  useEffect(() => setDraft(value), [value])

  useEffect(() => {
    const input = ref.current
    if (!input) return
    const handler = () => commitRef.current(input.value)
    input.addEventListener('change', handler)
    return () => input.removeEventListener('change', handler)
  }, [])

  return (
    <input
      ref={ref}
      type="color"
      aria-label={ariaLabel}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      className="h-7 w-10 cursor-pointer rounded border bg-transparent p-0.5"
    />
  )
}
