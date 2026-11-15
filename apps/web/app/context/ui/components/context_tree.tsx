import { ChevronRight } from 'lucide-react'

import { cn } from '@workspace/ui/lib/utils'

import { useTranslation } from '#common/ui/hooks/use_translation'

import type { JsonValue } from '#context/types/engine'
import { children, isContainer, joinPath } from '#context/ui/utils/json_tree'

interface Props {
  value: JsonValue
  selected: string
  expanded: Set<string>
  onSelect: (path: string) => void
  onToggle: (path: string) => void
}

function Preview({ value }: { value: JsonValue }) {
  const { t } = useTranslation()
  if (Array.isArray(value)) {
    return (
      <span className="text-muted-foreground">
        [{t('context.explorer.items', { count: value.length })}]
      </span>
    )
  }
  if (isContainer(value)) {
    return (
      <span className="text-muted-foreground">
        {'{'}
        {t('context.explorer.keys', { count: Object.keys(value).length })}
        {'}'}
      </span>
    )
  }
  return (
    <span
      className={cn(
        'truncate font-mono',
        typeof value === 'string' && 'text-emerald-700 dark:text-emerald-400',
        typeof value === 'number' && 'text-sky-700 dark:text-sky-400',
        typeof value === 'boolean' && 'text-violet-700 dark:text-violet-400',
        value === null && 'text-muted-foreground italic'
      )}
    >
      {typeof value === 'string' ? JSON.stringify(value) : String(value)}
    </span>
  )
}

function TreeNode({
  label,
  path,
  value,
  depth,
  ...props
}: Omit<Props, 'value'> & { label: string; path: string; value: JsonValue; depth: number }) {
  const { selected, expanded, onSelect, onToggle } = props
  const container = isContainer(value)
  const isOpen = container && expanded.has(path)

  return (
    <li>
      <div
        className={cn(
          'flex cursor-pointer items-center gap-1 rounded-md py-0.5 pr-2 text-sm hover:bg-muted',
          selected === path && 'bg-muted font-medium'
        )}
        style={{ paddingLeft: `${depth * 0.875 + 0.25}rem` }}
        onClick={() => onSelect(path)}
        role="treeitem"
        aria-selected={selected === path}
        aria-expanded={container ? isOpen : undefined}
      >
        {container ? (
          <button
            type="button"
            className="shrink-0 rounded text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation()
              onToggle(path)
            }}
            aria-label={label}
          >
            <ChevronRight size={14} className={cn('transition-transform', isOpen && 'rotate-90')} />
          </button>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        <span className="shrink-0">{label}</span>
        <span className="shrink-0 text-muted-foreground">:</span>
        <span className="flex min-w-0 text-xs">
          <Preview value={value} />
        </span>
      </div>

      {isOpen && (
        <ul role="group">
          {children(value).map(([key, child]) => (
            <TreeNode
              key={key}
              label={key}
              path={joinPath(path, key)}
              value={child}
              depth={depth + 1}
              {...props}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

export function ContextTree({ value, ...props }: Props) {
  const { t } = useTranslation()
  return (
    <ul role="tree" className="py-1">
      <TreeNode label={t('context.explorer.root')} path="" value={value} depth={0} {...props} />
    </ul>
  )
}
