import type { ReactNode } from 'react'
import { Link, useForm } from '@inertiajs/react'
import { Plus } from 'lucide-react'

import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { cn } from '@workspace/ui/lib/utils'

export type SidebarItem = {
  key: string
  href: string
  label: ReactNode
  hint?: ReactNode
  active: boolean
}

interface Props {
  title: string
  items: SidebarItem[]
  /** Omit to hide the create form */
  create?: {
    url: string
    field: string
    placeholder: string
    label: string
  }
  footer?: ReactNode
}

/** Item list + optional one-field create form, shared by the context admin pages. */
export function AdminListSidebar({ title, items, create, footer }: Props) {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r">
      <h2 className="px-3 pt-3 pb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {title}
      </h2>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2">
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              'flex flex-col rounded-md px-2 py-1.5 text-sm hover:bg-muted',
              item.active && 'bg-muted font-medium'
            )}
          >
            <span className="truncate font-mono">{item.label}</span>
            {item.hint && (
              <span className="truncate text-xs font-normal text-muted-foreground">
                {item.hint}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {footer}
      {create && <CreateForm {...create} />}
    </aside>
  )
}

function CreateForm({ url, field, placeholder, label }: NonNullable<Props['create']>) {
  const form = useForm<Record<string, string>>({ [field]: '' })

  return (
    <form
      className="flex items-center gap-1 border-t p-2"
      onSubmit={(e) => {
        e.preventDefault()
        form.post(url, { onSuccess: () => form.reset() })
      }}
    >
      <Input
        aria-label={placeholder}
        placeholder={placeholder}
        value={form.data[field]}
        onChange={(e) => form.setData(field, e.target.value)}
        aria-invalid={!!form.errors[field]}
        className="h-8 font-mono"
      />
      <Button
        type="submit"
        size="icon"
        className="size-8 shrink-0"
        disabled={form.processing}
        aria-label={label}
        title={label}
      >
        <Plus size={16} />
      </Button>
    </form>
  )
}
