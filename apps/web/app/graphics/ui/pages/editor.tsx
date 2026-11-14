import { useEffect, useMemo, useState } from 'react'
import { router } from '@inertiajs/react'
import { Save, TrashIcon } from 'lucide-react'

import { Button } from '@workspace/ui/components/button'
import { Checkbox } from '@workspace/ui/components/checkbox'
import { CopyButton } from '@workspace/ui/components/copy-button'
import { Input } from '@workspace/ui/components/input'
import { toast } from '@workspace/ui/hooks/use-toast'
import { Trans } from 'react-i18next'

import type { InertiaProps } from '#core/ui/types'

import { ConfirmDialog } from '#common/ui/components/confirm_dialog'
import WorkspaceLayout from '#common/ui/components/workspace_layout'
import { useTranslation } from '#common/ui/hooks/use_translation'
import { urlFor } from '~/app/client'

import { HtmlEditor } from '#graphics/ui/components/html_editor'
import { LayersSidebar } from '#graphics/ui/components/layers_sidebar'
import { PreviewFrame } from '#graphics/ui/components/preview_frame'
import {
  DEFAULT_RESOLUTION,
  ResolutionPicker,
  type Resolution,
} from '#graphics/ui/components/resolution_picker'

import type { Data } from '@generated/data'

type Layer = Data.Graphics.Layer.Variants['forEdit']

type PageProps = InertiaProps<{
  layers: Data.Graphics.Layer.Variants['forList'][]
  layer: Layer | null
  previewShell: string
  previewPlaceholder: string
}>

const RESOLUTION_STORAGE_KEY = 'graphics.preview.resolution'

function loadResolution(): Resolution {
  try {
    const stored = JSON.parse(localStorage.getItem(RESOLUTION_STORAGE_KEY) ?? 'null')
    if (Number.isInteger(stored?.width) && Number.isInteger(stored?.height)) return stored
  } catch {}
  return DEFAULT_RESOLUTION
}

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

function saveLayer(
  layer: Layer,
  patch: Partial<Pick<Layer, 'name' | 'enabled' | 'content'>>,
  onSuccess?: () => void
) {
  router.put(urlFor('layers.update', { id: layer.id }), patch, {
    preserveScroll: true,
    preserveState: true,
    onSuccess,
    onError: (errors) => {
      const first = Object.values(errors)[0]
      if (first) toast.error(first)
    },
  })
}

function LayerWorkspace({
  layer,
  previewShell,
  previewPlaceholder,
}: {
  layer: Layer
  previewShell: string
  previewPlaceholder: string
}) {
  const { t } = useTranslation()
  const [content, setContent] = useState(layer.content)
  const [name, setName] = useState(layer.name)
  const [resolution, setResolution] = useState(loadResolution)
  const [openDelete, setOpenDelete] = useState(false)
  const dirty = content !== layer.content

  useEffect(() => setName(layer.name), [layer.name])

  useEffect(() => {
    try {
      localStorage.setItem(RESOLUTION_STORAGE_KEY, JSON.stringify(resolution))
    } catch {}
  }, [resolution])

  // Unsaved content: confirm before leaving the page or switching layer.
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', onBeforeUnload)
    const removeInertiaListener = router.on('before', (event) => {
      if (event.detail.visit.method !== 'get') return
      if (!window.confirm(t('graphics.editor.leave_confirm'))) event.preventDefault()
    })
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      removeInertiaListener()
    }
  }, [dirty, t])

  const save = () => {
    if (!dirty) return
    saveLayer(layer, { content }, () => toast.success(t('graphics.editor.saved')))
  }

  const debouncedContent = useDebounced(content, 300)
  const srcDoc = useMemo(
    // Function replacer: `$` sequences in the content must not be read as replace patterns.
    () => previewShell.replace(previewPlaceholder, () => debouncedContent),
    [previewShell, previewPlaceholder, debouncedContent]
  )

  const cgUrl =
    typeof window === 'undefined'
      ? urlFor('cg.layer', { slug: layer.slug })
      : new URL(urlFor('cg.layer', { slug: layer.slug }), window.location.origin).href

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b px-3 py-2">
        <Input
          aria-label={t('graphics.editor.name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            if (name !== layer.name) saveLayer(layer, { name })
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
            if (e.key === 'Escape') setName(layer.name)
          }}
          className="h-8 w-56 font-medium"
        />

        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={layer.enabled}
            onCheckedChange={(checked) => saveLayer(layer, { enabled: checked === true })}
          />
          {t('graphics.editor.enabled')}
        </label>

        <div className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
          <a href={cgUrl} target="_blank" rel="noreferrer" className="truncate font-mono hover:underline">
            {cgUrl}
          </a>
          <CopyButton content={cgUrl} variant="ghost" size="sm" aria-label={t('graphics.editor.copy_url')} />
        </div>

        <div className="ml-auto flex items-center gap-2">
          {dirty && (
            <span className="text-xs text-muted-foreground">{t('graphics.editor.unsaved')}</span>
          )}
          <Button size="sm" onClick={save} disabled={!dirty} title="Ctrl+S">
            <Save size={16} />
            {t('graphics.editor.save')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={() => setOpenDelete(true)}
            aria-label={t('graphics.editor.delete')}
            title={t('graphics.editor.delete')}
          >
            <TrashIcon size={16} />
          </Button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-2">
        <div className="min-h-0 overflow-hidden border-r">
          <HtmlEditor value={content} onChange={setContent} onSave={save} />
        </div>

        <div className="flex min-h-0 flex-col gap-3 bg-muted/30 p-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium">{t('graphics.preview.title')}</h2>
            <ResolutionPicker value={resolution} onChange={setResolution} />
          </div>
          <PreviewFrame
            srcDoc={srcDoc}
            width={resolution.width}
            height={resolution.height}
            title={t('graphics.preview.title')}
          />
        </div>
      </div>

      <ConfirmDialog
        open={openDelete}
        onOpenChange={setOpenDelete}
        title={t('graphics.delete.title')}
        desc={
          <Trans
            i18nKey="graphics.delete.description"
            values={{ name: layer.name }}
            components={{ strong: <strong /> }}
          />
        }
        destructive
        confirmText={t('graphics.editor.delete')}
        handleConfirm={() => router.delete(urlFor('layers.destroy', { id: layer.id }))}
      />
    </div>
  )
}

export default function GraphicsEditorPage({
  layers,
  layer,
  previewShell,
  previewPlaceholder,
}: PageProps) {
  const { t } = useTranslation()

  return (
    <WorkspaceLayout>
      <LayersSidebar layers={layers} currentId={layer?.id ?? null} />
      {layer ? (
        <LayerWorkspace
          key={layer.id}
          layer={layer}
          previewShell={previewShell}
          previewPlaceholder={previewPlaceholder}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
          {t('graphics.layers.empty')}
        </div>
      )}
    </WorkspaceLayout>
  )
}
