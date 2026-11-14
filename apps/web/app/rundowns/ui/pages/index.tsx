import { useState } from 'react'
import { Link } from '@inertiajs/react'
import { EditIcon, EllipsisIcon, Plus, TrashIcon } from 'lucide-react'
import { ModalLink } from 'adonis-inertia-modal/react'

import { Button, buttonVariants } from '@workspace/ui/components/button'
import {
  ColumnDef,
  DataTable,
  type DataTableRowActionsProps,
} from '@workspace/ui/components/data-table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'

import type { InertiaProps } from '#core/ui/types'

import AuthenticatedLayout from '#common/ui/components/authenticated_layout'
import Heading from '#common/ui/components/heading'
import { Main } from '#common/ui/components/main'
import useCan from '#common/ui/hooks/use_can'
import { useTranslation } from '#common/ui/hooks/use_translation'
import { urlFor } from '~/app/client'

import { DeleteDialog } from '#rundowns/ui/components/delete_dialog'

import type { Data } from '@generated/data'

type RundownRow = Data.Rundowns.Rundown.Variants['forList']

type PageProps = InertiaProps<{
  rundowns: RundownRow[]
}>

function RowActions({ row }: DataTableRowActionsProps<RundownRow>) {
  const { t } = useTranslation()
  const [openDelete, setOpenDelete] = useState(false)

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
            <EllipsisIcon className="h-4 w-4" />
            <span className="sr-only">{t('rundowns.actions.open_menu')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem asChild>
            <ModalLink
              href={urlFor('rundowns.edit', { id: row.original.id })}
              className="flex w-full items-center justify-between"
            >
              {t('rundowns.actions.edit')}
              <DropdownMenuShortcut>
                <EditIcon size={16} />
              </DropdownMenuShortcut>
            </ModalLink>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpenDelete(true)} className="text-destructive">
            {t('rundowns.actions.delete')}
            <DropdownMenuShortcut>
              <TrashIcon size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteDialog
        open={openDelete}
        onOpenChange={setOpenDelete}
        url={urlFor('rundowns.destroy', { id: row.original.id })}
        name={row.original.name}
        titleKey="rundowns.delete.title"
        descriptionKey="rundowns.delete.description"
      />
    </>
  )
}

export default function ListRundownsPage({ rundowns }: PageProps) {
  const { t } = useTranslation()
  const { manageRundowns: canManage } = useCan()

  const columns: ColumnDef<RundownRow>[] = [
    {
      id: 'name',
      header: t('rundowns.table.name'),
      accessorKey: 'name',
      cell: ({ row }) => (
        <Link
          href={urlFor('rundowns.show', { id: row.original.id })}
          className="font-medium hover:underline"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      id: 'startTime',
      header: t('rundowns.table.start_time'),
      accessorKey: 'startTime',
      cell: ({ row }) => <span className="font-mono">{row.original.startTime}</span>,
    },
    {
      id: 'stepsCount',
      header: t('rundowns.table.steps'),
      accessorKey: 'stepsCount',
      meta: { columnClasses: 'hidden sm:table-cell' },
    },
    ...(canManage
      ? [
          {
            id: 'actions',
            meta: { columnClasses: 'w-[52px]' },
            cell: RowActions,
          } satisfies ColumnDef<RundownRow>,
        ]
      : []),
  ]

  return (
    <AuthenticatedLayout breadcrumbs={[{ label: t('rundowns.index.title') }]}>
      <Main>
        <Heading title={t('rundowns.index.title')} description={t('rundowns.index.description')}>
          {canManage && (
            <ModalLink href={urlFor('rundowns.create')} className={buttonVariants({ size: 'sm' })}>
              <span>{t('rundowns.actions.add')}</span>
              <Plus size={18} />
            </ModalLink>
          )}
        </Heading>

        <div className="flex-1 overflow-auto px-1 py-1">
          <DataTable columns={columns} data={rundowns} t={t} />
        </div>
      </Main>
    </AuthenticatedLayout>
  )
}
