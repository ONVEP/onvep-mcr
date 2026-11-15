import { useCallback, useState } from 'react'

import { cn } from '@workspace/ui/lib/utils'

import type { InertiaProps } from '#core/ui/types'

import WorkspaceLayout from '#common/ui/components/workspace_layout'
import useCan from '#common/ui/hooks/use_can'
import { useTranslation } from '#common/ui/hooks/use_translation'

import type { JsonObject } from '#context/types/engine'
import { ContextTree } from '#context/ui/components/context_tree'
import { ValueEditor } from '#context/ui/components/value_editor'
import { useLiveContext, type LiveStatus } from '#context/ui/hooks/use_live_context'
import { getAt, joinPath } from '#context/ui/utils/json_tree'

type PageProps = InertiaProps<{
  context: JsonObject | null
  engineUrl: string
}>

function StatusDot({ status }: { status: LiveStatus }) {
  const { t } = useTranslation()
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className={cn(
          'size-2 rounded-full',
          status === 'live' && 'bg-emerald-500',
          status === 'connecting' && 'animate-pulse bg-amber-500',
          status === 'offline' && 'bg-destructive'
        )}
      />
      {t(`context.explorer.${status}`)}
    </span>
  )
}

export default function ContextExplorerPage({ context: initial, engineUrl }: PageProps) {
  const { t } = useTranslation()
  const can = useCan()
  const { context, status } = useLiveContext(engineUrl, initial)
  const [selected, setSelected] = useState('')
  const [expanded, setExpanded] = useState(() => new Set(['']))

  const toggle = useCallback((path: string) => {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }, [])

  // Selecting a node reveals it: expand every ancestor.
  const select = useCallback((path: string) => {
    setSelected(path)
    setExpanded((current) => {
      const next = new Set(current)
      const segments = path === '' ? [] : path.split('.')
      let ancestor = ''
      next.add(ancestor)
      for (const segment of segments.slice(0, -1)) {
        ancestor = joinPath(ancestor, segment)
        next.add(ancestor)
      }
      return next
    })
  }, [])

  if (context === null) {
    return (
      <WorkspaceLayout>
        <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
          {t('context.explorer.unavailable')}
        </div>
      </WorkspaceLayout>
    )
  }

  const value = getAt(context, selected)

  return (
    <WorkspaceLayout>
      <aside className="flex w-80 shrink-0 flex-col border-r">
        <div className="flex items-center justify-between px-3 pt-3 pb-2">
          <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {t('context.explorer.tree')}
          </h2>
          <StatusDot status={status} />
        </div>
        <div className="min-h-0 flex-1 overflow-auto px-1">
          <ContextTree
            value={context}
            selected={selected}
            expanded={expanded}
            onSelect={select}
            onToggle={toggle}
          />
        </div>
      </aside>

      {value === undefined ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
          {t('context.explorer.missing')}
        </div>
      ) : (
        <ValueEditor
          key={selected}
          path={selected}
          value={value}
          canEdit={can.editContext}
          onSelect={select}
        />
      )}
    </WorkspaceLayout>
  )
}
