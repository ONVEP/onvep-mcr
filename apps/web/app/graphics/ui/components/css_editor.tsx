import { useMemo, useRef } from 'react'
import CodeMirror, { EditorView, keymap, Prec } from '@uiw/react-codemirror'
import { css } from '@codemirror/lang-css'

import { useResolvedTheme } from '#common/ui/hooks/use_resolved_theme'

interface Props {
  value: string
  onChange: (value: string) => void
  onSave: () => void
}

/** CSS editor: syntax highlighting, property completion, Mod-S saves. */
export function CssEditor({ value, onChange, onSave }: Props) {
  const theme = useResolvedTheme()
  const onSaveRef = useRef(onSave)
  onSaveRef.current = onSave

  const extensions = useMemo(
    () => [
      css(),
      Prec.high(
        keymap.of([
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
