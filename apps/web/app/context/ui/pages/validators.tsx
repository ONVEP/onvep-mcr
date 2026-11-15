import { useState } from 'react'
import { router } from '@inertiajs/react'
import { Save, TrashIcon } from 'lucide-react'
import { Trans } from 'react-i18next'

import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { toast } from '@workspace/ui/hooks/use-toast'

import type { InertiaProps } from '#core/ui/types'

import AdminLayout from '#common/ui/components/admin_layout'
import { ConfirmDialog } from '#common/ui/components/confirm_dialog'
import { useTranslation } from '#common/ui/hooks/use_translation'
import { urlFor } from '~/app/client'

import type { ContextValidator, JsonSchema } from '#context/types/engine'
import { AdminListSidebar } from '#context/ui/components/admin_list_sidebar'
import { SchemaBuilder } from '#context/ui/components/schema_builder'
import { useUnsavedGuard } from '#context/ui/hooks/use_unsaved_guard'
import { sameJson } from '#context/ui/utils/json_tree'

type PageProps = InertiaProps<{
  validators: ContextValidator[]
  validator: ContextValidator | null
}>

function ValidatorWorkspace({ validator }: { validator: ContextValidator }) {
  const { t } = useTranslation()
  const [path, setPath] = useState(validator.path)
  const [schema, setSchema] = useState<JsonSchema>(validator.schema)
  const [openDelete, setOpenDelete] = useState(false)
  // The server trims the path and reorders the schema keys (jsonb): compare what it would store.
  const dirty = path.trim() !== validator.path || !sameJson(schema, validator.schema)

  useUnsavedGuard(dirty, t('context.validators.leave_confirm'))

  const save = () => {
    if (!dirty) return
    router.put(
      urlFor('context.validators.update', { id: validator.id }),
      { path, schema: JSON.stringify(schema) },
      {
        preserveScroll: true,
        preserveState: true,
        onSuccess: (page) => {
          if (!page.flash?.error) toast.success(t('context.validators.saved'))
        },
      }
    )
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b px-3 py-2">
        <label className="flex items-center gap-2 text-sm">
          {t('context.validators.path')}
          <Input
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder={t('context.validators.root')}
            className="h-8 w-64 font-mono"
          />
        </label>

        <div className="ml-auto flex items-center gap-2">
          {dirty && (
            <span className="text-xs text-muted-foreground">{t('context.validators.unsaved')}</span>
          )}
          <Button size="sm" onClick={save} disabled={!dirty}>
            <Save size={16} />
            {t('context.validators.save')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={() => setOpenDelete(true)}
            aria-label={t('context.validators.delete')}
            title={t('context.validators.delete')}
          >
            <TrashIcon size={16} />
          </Button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 content-start gap-4 overflow-y-auto p-4">
        <p className="text-xs text-muted-foreground">{t('context.validators.path_hint')}</p>

        <section className="grid gap-2">
          <h3 className="text-sm font-medium">{t('context.validators.schema')}</h3>
          <SchemaBuilder schema={schema} onChange={setSchema} />
        </section>

        <details className="rounded-md border p-3 text-sm">
          <summary className="cursor-pointer text-muted-foreground">
            {t('context.validators.json_preview')}
          </summary>
          <pre className="mt-2 overflow-x-auto font-mono text-xs">
            {JSON.stringify(schema, null, 2)}
          </pre>
        </details>
      </div>

      <ConfirmDialog
        open={openDelete}
        onOpenChange={setOpenDelete}
        title={t('context.validators.delete_title')}
        desc={
          <Trans
            i18nKey="context.validators.delete_description"
            values={{ path: validator.path || t('context.validators.root') }}
            components={{ strong: <strong /> }}
          />
        }
        destructive
        confirmText={t('context.validators.delete')}
        handleConfirm={() =>
          router.delete(urlFor('context.validators.destroy', { id: validator.id }))
        }
      />
    </div>
  )
}

export default function ContextValidatorsPage({ validators, validator }: PageProps) {
  const { t } = useTranslation()

  return (
    <AdminLayout
      flush
      breadcrumbs={[
        { label: t('common.layout.navMain.context') },
        { label: t('context.validators.title') },
      ]}
    >
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <AdminListSidebar
          title={t('context.validators.title')}
          items={validators.map(({ id, path }) => ({
            key: String(id),
            href: urlFor('context.validators.show', { id }),
            label: path || t('context.validators.root'),
            active: id === validator?.id,
          }))}
          create={{
            url: urlFor('context.validators.store'),
            field: 'path',
            placeholder: t('context.validators.new_placeholder'),
            label: t('context.validators.add'),
          }}
        />
        {validator ? (
          <ValidatorWorkspace key={validator.id} validator={validator} />
        ) : (
          <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
            {t('context.validators.empty')}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
