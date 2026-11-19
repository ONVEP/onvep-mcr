import { useRef, useState, type KeyboardEvent } from 'react'
import { Link, router, useForm } from '@inertiajs/react'
import { ChevronRight, Plus, TrashIcon } from 'lucide-react'

import { Button, buttonVariants } from '@workspace/ui/components/button'
import { ColumnDef, DataTable } from '@workspace/ui/components/data-table'
import { Input } from '@workspace/ui/components/input'
import { TableCell, TableRow } from '@workspace/ui/components/table'
import { toast } from '@workspace/ui/hooks/use-toast'
import { cn } from '@workspace/ui/lib/utils'

import type { InertiaProps } from '#core/ui/types'

import AdminLayout from '#common/ui/components/admin_layout'
import Heading from '#common/ui/components/heading'
import { InlineInput } from '#common/ui/components/inline_fields'
import { Main } from '#common/ui/components/main'
import { useTranslation } from '#common/ui/hooks/use_translation'
import { urlFor } from '~/app/client'

import { DeleteDialog } from '#rundowns/ui/components/delete_dialog'

import type { Data } from '@generated/data'

type CompanionServerRow = Data.Rundowns.CompanionServer.Variants['forList']

type PageProps = InertiaProps<{
  companionServers: CompanionServerRow[]
}>

function saveCompanionServer(
  server: CompanionServerRow,
  patch: Partial<Pick<CompanionServerRow, 'name' | 'url'>>,
  onError?: () => void
) {
  router.put(
    urlFor('companion_servers.update', { id: server.id }),
    { name: server.name, url: server.url, ...patch },
    {
      preserveScroll: true,
      preserveState: true,
      onError: (errors) => {
        const first = Object.values(errors)[0]
        if (first) toast.error(first)
        onError?.()
      },
    }
  )
}

function RowActions({ server }: { server: CompanionServerRow }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <div className="flex justify-end">
      <Button
        variant="ghost"
        className="h-8 w-8 p-0 text-destructive"
        onClick={() => setOpen(true)}
        aria-label={t('rundowns.actions.delete')}
        title={t('rundowns.actions.delete')}
      >
        <TrashIcon size={16} />
      </Button>
      <Link
        href={urlFor('companion_servers.show', { id: server.id })}
        className={cn(buttonVariants({ variant: 'ghost' }), 'h-8 w-8 p-0')}
        aria-label={t('rundowns.companion_servers.actions.open')}
        title={t('rundowns.companion_servers.actions.open')}
      >
        <ChevronRight size={16} />
      </Link>
      <DeleteDialog
        open={open}
        onOpenChange={setOpen}
        url={urlFor('companion_servers.destroy', { id: server.id })}
        name={server.name}
        titleKey="rundowns.companion_servers.delete.title"
        descriptionKey="rundowns.companion_servers.delete.description"
      />
    </div>
  )
}

function NewCompanionServerRow({ columnCount }: { columnCount: number }) {
  const { t } = useTranslation()
  const nameRef = useRef<HTMLInputElement>(null)

  const form = useForm({ name: '', url: '' })

  const submit = () =>
    form.post(urlFor('companion_servers.store'), {
      preserveScroll: true,
      onSuccess: () => {
        form.reset()
        nameRef.current?.focus()
      },
    })

  const submitOnEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit()
    }
  }

  const error = Object.values(form.errors)[0]

  return (
    <>
      <TableRow className="hover:bg-transparent">
        <TableCell>
          <Input
            ref={nameRef}
            aria-label={t('rundowns.companion_servers.table.name')}
            placeholder={t('rundowns.companion_servers.new.name_placeholder')}
            value={form.data.name}
            onChange={(e) => form.setData('name', e.target.value)}
            onKeyDown={submitOnEnter}
            aria-invalid={!!form.errors.name}
            className="h-7"
          />
        </TableCell>
        <TableCell>
          <Input
            aria-label={t('rundowns.companion_servers.table.url')}
            placeholder={t('rundowns.companion_servers.new.url_placeholder')}
            value={form.data.url}
            onChange={(e) => form.setData('url', e.target.value)}
            onKeyDown={submitOnEnter}
            aria-invalid={!!form.errors.url}
            className="h-7"
          />
        </TableCell>
        <TableCell />
        <TableCell className="text-right">
          <Button
            size="icon"
            className="size-8"
            onClick={submit}
            disabled={form.processing}
            aria-label={t('rundowns.companion_servers.actions.add')}
            title={t('rundowns.companion_servers.actions.add')}
          >
            <Plus size={16} />
          </Button>
        </TableCell>
      </TableRow>
      {error && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={columnCount} className="text-sm text-destructive">
            {error}
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

export default function ListCompanionServersPage({ companionServers }: PageProps) {
  const { t } = useTranslation()

  const columns: ColumnDef<CompanionServerRow>[] = [
    {
      id: 'name',
      header: t('rundowns.companion_servers.table.name'),
      cell: ({ row }) => (
        <InlineInput
          aria-label={t('rundowns.companion_servers.table.name')}
          value={row.original.name}
          onCommit={(name, revert) => saveCompanionServer(row.original, { name }, revert)}
          className="font-medium"
        />
      ),
    },
    {
      id: 'url',
      header: t('rundowns.companion_servers.table.url'),
      cell: ({ row }) => (
        <InlineInput
          aria-label={t('rundowns.companion_servers.table.url')}
          value={row.original.url}
          onCommit={(url, revert) => saveCompanionServer(row.original, { url }, revert)}
          className="font-mono text-xs"
        />
      ),
    },
    {
      id: 'technicalPages',
      header: t('rundowns.companion_servers.table.technical_pages'),
      meta: { columnClasses: 'w-[140px]' },
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.technicalPages.length || '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      meta: { columnClasses: 'w-[88px]' },
      cell: ({ row }) => <RowActions server={row.original} />,
    },
  ]

  return (
    <AdminLayout breadcrumbs={[{ label: t('rundowns.companion_servers.page.title') }]}>
      <Main>
        <Heading
          title={t('rundowns.companion_servers.page.title')}
          description={t('rundowns.companion_servers.page.description')}
        />

        <div className="flex-1 overflow-auto px-1 py-1">
          <DataTable
            columns={columns}
            data={companionServers}
            t={t}
            footer={<NewCompanionServerRow columnCount={columns.length} />}
          />
        </div>
      </Main>
    </AdminLayout>
  )
}
