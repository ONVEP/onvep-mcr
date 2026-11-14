import { Link, useForm } from '@inertiajs/react'
import { Plus } from 'lucide-react'

import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { cn } from '@workspace/ui/lib/utils'

import { useTranslation } from '#common/ui/hooks/use_translation'
import { urlFor } from '~/app/client'

import type { Data } from '@generated/data'

type LayerItem = Data.Graphics.Layer.Variants['forList']

export function LayersSidebar({
  layers,
  currentId,
}: {
  layers: LayerItem[]
  currentId: number | null
}) {
  const { t } = useTranslation()
  const form = useForm({ name: '' })

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r">
      <h2 className="px-3 pt-3 pb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {t('graphics.layers.title')}
      </h2>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2">
        {layers.map((layer) => (
          <Link
            key={layer.id}
            href={urlFor('layers.show', { id: layer.id })}
            className={cn(
              'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted',
              layer.id === currentId && 'bg-muted font-medium'
            )}
          >
            <span
              className={cn(
                'size-2 shrink-0 rounded-full',
                layer.enabled ? 'bg-emerald-500' : 'bg-muted-foreground/40'
              )}
              title={t(layer.enabled ? 'graphics.editor.enabled' : 'graphics.editor.disabled')}
            />
            <span className="truncate">{layer.name}</span>
          </Link>
        ))}
      </nav>

      <form
        className="flex items-center gap-1 border-t p-2"
        onSubmit={(e) => {
          e.preventDefault()
          form.post(urlFor('layers.store'), { onSuccess: () => form.reset() })
        }}
      >
        <Input
          aria-label={t('graphics.layers.new_placeholder')}
          placeholder={t('graphics.layers.new_placeholder')}
          value={form.data.name}
          onChange={(e) => form.setData('name', e.target.value)}
          aria-invalid={!!form.errors.name}
          className="h-8"
        />
        <Button
          type="submit"
          size="icon"
          className="size-8 shrink-0"
          disabled={form.processing}
          aria-label={t('graphics.layers.add')}
        >
          <Plus size={16} />
        </Button>
      </form>
    </aside>
  )
}
