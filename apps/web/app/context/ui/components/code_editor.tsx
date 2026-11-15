import { useMemo, useRef } from 'react'
import CodeMirror, { EditorView, keymap, Prec } from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'

import { useResolvedTheme } from '#common/ui/hooks/use_resolved_theme'

interface Props {
  value: string
  onChange: (value: string) => void
  onSave?: () => void
  readOnly?: boolean
}

/** JavaScript/JSON editor: syntax highlighting, Mod-S saves. */
export function CodeEditor({ value, onChange, onSave, readOnly = false }: Props) {
  const theme = useResolvedTheme()
  const onSaveRef = useRef(onSave)
  onSaveRef.current = onSave

  const extensions = useMemo(
    () => [
      javascript(),
      Prec.high(
        keymap.of([
          {
            key: 'Mod-s',
            preventDefault: true,
            run: () => {
              onSaveRef.current?.()
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
      readOnly={readOnly}
      height="100%"
      className="h-full text-sm"
      basicSetup={{ tabSize: 2 }}
    />
  )
}
