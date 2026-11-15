import { useState } from 'react'
import { Link, router } from '@inertiajs/react'
import { RotateCcw } from 'lucide-react'

import { Badge } from '@workspace/ui/components/badge'
import { Button, buttonVariants } from '@workspace/ui/components/button'
import { Checkbox } from '@workspace/ui/components/checkbox'

import type { InertiaProps } from '#core/ui/types'

import AdminLayout from '#common/ui/components/admin_layout'
import { ConfirmDialog } from '#common/ui/components/confirm_dialog'
import { useTranslation } from '#common/ui/hooks/use_translation'
import { urlFor } from '~/app/client'

import type { ContextVersion, ContextVersionPage } from '#context/types/engine'
import { AdminListSidebar } from '#context/ui/components/admin_list_sidebar'
import { CodeEditor } from '#context/ui/components/code_editor'

type PageProps = InertiaProps<{
  versions: ContextVersionPage
  version: ContextVersion | null
  latestId: number | null
}>

function useFormatDate() {
  const { language } = useTranslation()
  return (iso: string) =>
    new Date(iso).toLocaleString(language, { dateStyle: 'short', timeStyle: 'medium' })
}

function VersionWorkspace({ version, isLatest }: { version: ContextVersion; isLatest: boolean }) {
  const { t } = useTranslation()
  const formatDate = useFormatDate()
  const [bypassMutators, setBypassMutators] = useState(false)
  const [openRestore, setOpenRestore] = useState(false)

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b px-3 py-2">
        <span className="text-sm font-medium">
          {t('context.versions.version', { id: version.id })}
        </span>
        <span className="text-sm text-muted-foreground">{formatDate(version.createdAt)}</span>
        {isLatest && <Badge variant="secondary">{t('context.versions.current')}</Badge>}

        <div className="ml-auto flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={bypassMutators}
              onCheckedChange={(checked) => setBypassMutators(checked === true)}
              disabled={isLatest}
            />
            {t('context.versions.bypass_mutators')}
          </label>
          <Button size="sm" onClick={() => setOpenRestore(true)} disabled={isLatest}>
            <RotateCcw size={16} />
            {t('context.versions.restore')}
          </Button>
        </div>
      </header>

      <p className="border-b px-3 py-2 text-xs text-muted-foreground">
        {t('context.versions.bypass_hint')}
      </p>

      <div className="min-h-0 flex-1 overflow-hidden" aria-label={t('context.versions.content')}>
        <CodeEditor value={JSON.stringify(version.context, null, 2)} onChange={() => {}} readOnly />
      </div>

      <ConfirmDialog
        open={openRestore}
        onOpenChange={setOpenRestore}
        title={t('context.versions.restore_title', { id: version.id })}
        desc={t('context.versions.restore_description')}
        confirmText={t('context.versions.restore')}
        handleConfirm={() =>
          router.post(urlFor('context.versions.restore', { id: version.id }), { bypassMutators })
        }
      />
    </div>
  )
}

function Pagination({ versions, currentId }: { versions: ContextVersionPage; currentId: number }) {
  const { t } = useTranslation()
  const { currentPage, lastPage } = versions.meta
  if (lastPage <= 1) return null

  const href = (page: number) =>
    `${urlFor('context.versions.show', { id: currentId })}?page=${page}`
  const link = buttonVariants({ variant: 'ghost', size: 'sm' })

  return (
    <div className="flex items-center justify-between gap-1 border-t p-2 text-xs text-muted-foreground">
      {currentPage > 1 ? (
        <Link href={href(currentPage - 1)} className={link} preserveScroll>
          {t('context.versions.previous')}
        </Link>
      ) : (
        <span />
      )}
      {t('context.versions.page', { current: currentPage, last: lastPage })}
      {currentPage < lastPage ? (
        <Link href={href(currentPage + 1)} className={link} preserveScroll>
          {t('context.versions.next')}
        </Link>
      ) : (
        <span />
      )}
    </div>
  )
}

export default function ContextVersionsPage({ versions, version, latestId }: PageProps) {
  const { t } = useTranslation()
  const formatDate = useFormatDate()
  const page = versions.meta.currentPage

  return (
    <AdminLayout
      breadcrumbs={[
        { label: t('common.layout.navMain.context') },
        { label: t('context.versions.title') },
      ]}
    >
      <div className="flex min-h-[32rem] flex-1 overflow-hidden rounded-md border">
        <AdminListSidebar
          title={t('context.versions.title')}
          items={versions.data.map(({ id, createdAt }) => ({
            key: String(id),
            // Keep the list page while browsing its versions.
            href: `${urlFor('context.versions.show', { id })}?page=${page}`,
            label: `#${id}${id === latestId ? ` · ${t('context.versions.current')}` : ''}`,
            hint: formatDate(createdAt),
            active: id === version?.id,
          }))}
          footer={version && <Pagination versions={versions} currentId={version.id} />}
        />
        {version ? (
          <VersionWorkspace key={version.id} version={version} isLatest={version.id === latestId} />
        ) : (
          <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
            {t('context.versions.empty')}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
