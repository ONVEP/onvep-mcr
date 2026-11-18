import { useState } from 'react'
import { router } from '@inertiajs/react'
import { Play, Save, TrashIcon } from 'lucide-react'
import { Trans } from 'react-i18next'

import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import { Checkbox } from '@workspace/ui/components/checkbox'
import { toast } from '@workspace/ui/hooks/use-toast'

import type { InertiaProps } from '#core/ui/types'

import AdminLayout from '#common/ui/components/admin_layout'
import { ConfirmDialog } from '#common/ui/components/confirm_dialog'
import { useTranslation } from '#common/ui/hooks/use_translation'
import { urlFor } from '~/app/client'

import type { ContextMutator, ContextMutatorSummary } from '#context/types/engine'
import { AdminListSidebar } from '#context/ui/components/admin_list_sidebar'
import { CodeEditor } from '#context/ui/components/code_editor'
import { useUnsavedGuard } from '#context/ui/hooks/use_unsaved_guard'

type PageProps = InertiaProps<{
  mutators: ContextMutatorSummary[]
  mutator: ContextMutator | null
}>

function setEnabled(url: string, enabled: boolean) {
  // Keeps unsaved edits: the workspace stays mounted with its local state.
  router.put(url, { enabled }, { preserveScroll: true, preserveState: true })
}

function MutatorWorkspace({ mutator }: { mutator: ContextMutator }) {
  const { t } = useTranslation()
  const [source, setSource] = useState(mutator.source)
  const [openDelete, setOpenDelete] = useState(false)
  const dirty = source !== mutator.source

  useUnsavedGuard(dirty, t('context.mutators.leave_confirm'))

  const save = () => {
    if (!dirty) return
    router.put(
      urlFor('context.mutators.update', { name: mutator.name }),
      { source },
      {
        preserveScroll: true,
        preserveState: true,
        // The engine refusing the code comes back as a flash error toast.
        onSuccess: (page) => {
          if (!page.flash?.error) toast.success(t('context.mutators.saved'))
        },
      }
    )
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b px-3 py-2">
        <span className="font-mono text-sm font-medium">{mutator.name}</span>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={mutator.enabled}
            onCheckedChange={(checked) =>
              setEnabled(
                urlFor('context.mutators.state.update', { name: mutator.name }),
                checked === true
              )
            }
          />
          {t('context.mutators.enabled')}
        </label>
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-xs text-muted-foreground">
            {t('context.mutators.subscriptions')}:
          </span>
          {mutator.subscriptions.length === 0 ? (
            <span className="text-xs text-muted-foreground italic">
              {t('context.mutators.no_subscriptions')}
            </span>
          ) : (
            mutator.subscriptions.map((subscription) => (
              <Badge key={subscription} variant="secondary" className="font-mono">
                {subscription}
              </Badge>
            ))
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {dirty && (
            <span className="text-xs text-muted-foreground">{t('context.mutators.unsaved')}</span>
          )}
          <Button
            size="sm"
            variant="outline"
            // Runs what the engine has: unsaved edits would silently not apply.
            disabled={dirty}
            title={t(dirty ? 'context.mutators.run_unsaved_hint' : 'context.mutators.run_hint')}
            onClick={() =>
              router.post(
                urlFor('context.mutators.run.store', { name: mutator.name }),
                {},
                { preserveScroll: true, preserveState: true }
              )
            }
          >
            <Play size={16} />
            {t('context.mutators.run')}
          </Button>
          <Button size="sm" onClick={save} disabled={!dirty} title="Ctrl+S">
            <Save size={16} />
            {t('context.mutators.save')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={() => setOpenDelete(true)}
            aria-label={t('context.mutators.delete')}
            title={t('context.mutators.delete')}
          >
            <TrashIcon size={16} />
          </Button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden">
        <CodeEditor value={source} onChange={setSource} onSave={save} />
      </div>

      <ConfirmDialog
        open={openDelete}
        onOpenChange={setOpenDelete}
        title={t('context.mutators.delete_title')}
        desc={
          <Trans
            i18nKey="context.mutators.delete_description"
            values={{ name: mutator.name }}
            components={{ strong: <strong /> }}
          />
        }
        destructive
        confirmText={t('context.mutators.delete')}
        handleConfirm={() =>
          router.delete(urlFor('context.mutators.destroy', { name: mutator.name }))
        }
      />
    </div>
  )
}

export default function ContextMutatorsPage({ mutators, mutator }: PageProps) {
  const { t } = useTranslation()

  return (
    <AdminLayout
      flush
      breadcrumbs={[
        { label: t('common.layout.navMain.context') },
        { label: t('context.mutators.title') },
      ]}
    >
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <AdminListSidebar
          title={t('context.mutators.title')}
          items={mutators.map(({ name, subscriptions, enabled }) => ({
            key: name,
            href: urlFor('context.mutators.show', { name }),
            label: name,
            hint: subscriptions.join(', '),
            active: name === mutator?.name,
            status: {
              enabled,
              label: t(enabled ? 'context.mutators.enabled' : 'context.mutators.disabled'),
            },
          }))}
          create={{
            url: urlFor('context.mutators.store'),
            field: 'name',
            placeholder: t('context.mutators.new_placeholder'),
            label: t('context.mutators.add'),
          }}
        />
        {mutator ? (
          <MutatorWorkspace key={mutator.name} mutator={mutator} />
        ) : (
          <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
            {t('context.mutators.empty')}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
