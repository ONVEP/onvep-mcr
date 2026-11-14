import { useEffect, useMemo, useRef, useState } from 'react'
import CodeMirror, { EditorView, keymap, Prec } from '@uiw/react-codemirror'
import { html, htmlLanguage } from '@codemirror/lang-html'
import { abbreviationTracker, expandAbbreviation } from '@emmetio/codemirror6-plugin'

import { useTheme } from '@workspace/ui/components/theme-provider'

import { tailwindCompletion } from '#graphics/ui/components/tailwind_completion'

interface Props {
  value: string
  onChange: (value: string) => void
  onSave: () => void
}

function useResolvedTheme(): 'light' | 'dark' {
  const { theme } = useTheme()
  const [systemDark, setSystemDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [])

  if (theme === 'system') return systemDark ? 'dark' : 'light'
  return theme === 'dark' ? 'dark' : 'light'
}

/** HTML editor: syntax highlighting, Emmet (Tab expands), Tailwind class completion, Mod-S saves. */
export function HtmlEditor({ value, onChange, onSave }: Props) {
  const theme = useResolvedTheme()
  const onSaveRef = useRef(onSave)
  onSaveRef.current = onSave

  const extensions = useMemo(
    () => [
      html(),
      htmlLanguage.data.of({ autocomplete: tailwindCompletion }),
      abbreviationTracker(),
      // Above the default keymap so Tab expands an abbreviation before falling back to indent.
      Prec.high(
        keymap.of([
          { key: 'Tab', run: expandAbbreviation },
          {
            key: 'Mod-s',
            preventDefault: true,
            run: () => {
              onSaveRef.current()
              return true
            },
          },
        ])
      ),
      EditorView.lineWrapping,
    ],
    []
  )

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={extensions}
      theme={theme}
      height="100%"
      className="h-full text-sm"
      basicSetup={{ tabSize: 2 }}
    />
  )
}
