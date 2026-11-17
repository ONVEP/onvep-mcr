import { useRef, useState, type ChangeEvent } from 'react'
import { router } from '@inertiajs/react'
import { FileIcon, RefreshCw, TrashIcon, Upload } from 'lucide-react'
import { Trans } from 'react-i18next'

import { Button } from '@workspace/ui/components/button'
import { CopyButton } from '@workspace/ui/components/copy-button'
import { ColumnDef, DataTable } from '@workspace/ui/components/data-table'
import { toast } from '@workspace/ui/hooks/use-toast'

import type { InertiaProps } from '#core/ui/types'

import AdminLayout from '#common/ui/components/admin_layout'
import { ConfirmDialog } from '#common/ui/components/confirm_dialog'
import Heading from '#common/ui/components/heading'
import { Main } from '#common/ui/components/main'
import { useTranslation } from '#common/ui/hooks/use_translation'
import { urlFor } from '~/app/client'

import type { Data } from '@generated/data'

type AssetRow = Data.Graphics.Asset.Variants['forList']

type PageProps = InertiaProps<{
  assets: AssetRow[]
}>

const ACCEPT = 'image/*,video/*,audio/*,.woff,.woff2,.ttf,.otf,.json'

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function toastFirstError(errors: Record<string, string>) {
  const first = Object.values(errors)[0]
  if (first) toast.error(first)
}

// One request per file: Inertia cancels a visit when another starts, so they are chained.
function uploadAll(files: File[], onProgress: (status: string | null) => void, total = files.length) {
  const [file, ...rest] = files
  if (!file) return onProgress(null)
  const position = total > 1 ? `${total - rest.length}/${total} · ` : ''
  router.post(
    urlFor('assets.store'),
    { file },
    {
      preserveScroll: true,
      onProgress: (event) => onProgress(`${position}${event?.percentage ?? 0}%`),
      onError: toastFirstError,
      onFinish: () => uploadAll(rest, onProgress, total),
    }
  )
}

function Thumbnail({ asset }: { asset: AssetRow }) {
  const className = 'size-12 rounded border bg-muted object-contain'
  if (asset.mimeType.startsWith('image/')) {
    return <img src={asset.url} alt="" className={className} loading="lazy" />
  }
  if (asset.mimeType.startsWith('video/')) {
    return <video src={asset.url} className={className} muted preload="metadata" />
  }
  return (
    <span className={`${className} flex items-center justify-center text-muted-foreground`}>
      <FileIcon size={20} />
    </span>
  )
}

function ReplaceAction({ row }: { row: AssetRow }) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<number | null>(null)

  const replace = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    router.put(
      urlFor('assets.update', { id: row.id }),
      { file },
      {
        preserveScroll: true,
        onProgress: (event) => setProgress(event?.percentage ?? 0),
        onSuccess: () => toast.success(t('graphics.assets.replaced')),
        onError: toastFirstError,
        onFinish: () => setProgress(null),
      }
    )
  }

  if (progress !== null) {
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center text-xs tabular-nums">
        {progress}%
      </span>
    )
  }

  return (
    <>
      <Button
        variant="ghost"
        className="h-8 w-8 p-0"
        onClick={() => inputRef.current?.click()}
        aria-label={t('graphics.assets.actions.replace')}
        title={t('graphics.assets.actions.replace')}
      >
        <RefreshCw size={16} />
      </Button>
      <input ref={inputRef} type="file" className="hidden" accept={ACCEPT} onChange={replace} />
    </>
  )
}

function DeleteAction({ row }: { row: AssetRow }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        className="h-8 w-8 p-0 text-destructive"
        onClick={() => setOpen(true)}
        aria-label={t('graphics.assets.actions.delete')}
        title={t('graphics.assets.actions.delete')}
      >
        <TrashIcon size={16} />
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t('graphics.assets.delete.title')}
        desc={
          <Trans
            i18nKey="graphics.assets.delete.description"
            values={{ name: row.name }}
            components={{ strong: <strong /> }}
          />
        }
        destructive
        confirmText={t('graphics.assets.actions.delete')}
        handleConfirm={() =>
          router.delete(urlFor('assets.destroy', { id: row.id }), {
            preserveScroll: true,
            onSuccess: () => setOpen(false),
          })
        }
      />
    </>
  )
}

export default function AssetsPage({ assets }: PageProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState<string | null>(null)

  const upload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!files.length) return
    setUploading('0%')
    uploadAll(files, setUploading)
  }

  const columns: ColumnDef<AssetRow>[] = [
    {
      id: 'preview',
      meta: { columnClasses: 'w-[72px]' },
      cell: ({ row }) => <Thumbnail asset={row.original} />,
    },
    {
      id: 'name',
      header: t('graphics.assets.table.name'),
      cell: ({ row }) => <span className="font-mono">{row.original.name}</span>,
    },
    {
      id: 'size',
      header: t('graphics.assets.table.size'),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{formatSize(row.original.size)}</span>
      ),
    },
    {
      id: 'usage',
      header: t('graphics.assets.table.usage'),
      cell: ({ row }) => (
        <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
          {row.original.url}
          <CopyButton
            content={row.original.url}
            variant="ghost"
            size="sm"
            aria-label={t('graphics.assets.actions.copy')}
          />
        </span>
      ),
    },
    {
      id: 'actions',
      meta: { columnClasses: 'w-[96px]' },
      cell: ({ row }) => (
        <div className="flex items-center">
          <ReplaceAction row={row.original} />
          <DeleteAction row={row.original} />
        </div>
      ),
    },
  ]

  return (
    <AdminLayout
      breadcrumbs={[
        { label: t('common.layout.navMain.graphics') },
        { label: t('graphics.assets.page.title') },
      ]}
    >
      <Main>
        <div className="flex flex-wrap items-start gap-3">
          <Heading
            title={t('graphics.assets.page.title')}
            description={t('graphics.assets.page.description')}
          />
          <Button
            className="ml-auto"
            onClick={() => inputRef.current?.click()}
            disabled={uploading !== null}
          >
            <Upload size={16} />
            {uploading ?? t('graphics.assets.actions.upload')}
          </Button>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={ACCEPT}
            multiple
            onChange={upload}
          />
        </div>

        <div className="overflow-auto px-1 py-1">
          <DataTable columns={columns} data={assets} t={t} />
        </div>
      </Main>
    </AdminLayout>
  )
}
