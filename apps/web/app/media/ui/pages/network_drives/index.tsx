import { router } from '@inertiajs/react'
import { Plus } from 'lucide-react'
import { ModalLink } from 'adonis-inertia-modal/react'

import { buttonVariants } from '@workspace/ui/components/button'
import { ColumnDef, DataTable } from '@workspace/ui/components/data-table'
import { useDataTable } from '@workspace/ui/hooks/use-data-table'

import type { InertiaProps } from '#core/ui/types'

import AdminLayout from '#common/ui/components/admin_layout'
import Heading from '#common/ui/components/heading'
import { Main } from '#common/ui/components/main'
import { useTranslation } from '#common/ui/hooks/use_translation'
import { urlFor } from '~/app/client'

import { NetworkDrivesRowActions } from '#media/ui/components/network_drives_row_actions'

import type { Data } from '@generated/data'

type NetworkDriveRow = Data.Media.NetworkDrive.Variants['forList']

type PageProps = InertiaProps<{
  networkDrives: {
    data: NetworkDriveRow[]
    metadata: {
      total: number
      perPage: number
      currentPage: number
      lastPage: number
      firstPage: number
      firstPageUrl?: string
      lastPageUrl?: string
      nextPageUrl?: string | null
      previousPageUrl?: string | null
    }
  }
  q?: string
}>

export default function ListNetworkDrivesPage({ networkDrives, q }: PageProps) {
  const { t } = useTranslation()

  const remoteTableOptions = useDataTable({
    data: networkDrives,
    visit: ({ page, perPage }) =>
      router.get(
        urlFor('network_drives.index'),
        { page, perPage, q },
        { preserveState: true, preserveScroll: true, replace: true }
      ),
  })

  const columns: ColumnDef<NetworkDriveRow>[] = [
    {
      id: 'name',
      header: t('media.network_drives.table.columns.name'),
      accessorKey: 'name',
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{row.original.name}</div>
          <div className="mt-0.5 truncate font-mono text-xs text-muted-foreground sm:hidden">
            {row.original.url}
          </div>
        </div>
      ),
    },
    {
      id: 'url',
      header: t('media.network_drives.table.columns.url'),
      accessorKey: 'url',
      meta: { columnClasses: 'hidden sm:table-cell' },
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.url}</span>,
    },
    {
      id: 'username',
      header: t('media.network_drives.table.columns.username'),
      accessorKey: 'username',
      meta: { columnClasses: 'hidden md:table-cell' },
    },
    {
      id: 'actions',
      meta: { columnClasses: 'w-[52px]' },
      cell: NetworkDrivesRowActions,
    },
  ]

  return (
    <AdminLayout breadcrumbs={[{ label: t('media.network_drives.page.title') }]}>
      <Main>
        <Heading
          title={t('media.network_drives.page.title')}
          description={t('media.network_drives.page.description')}
        >
          <ModalLink href={urlFor('network_drives.create')} className={buttonVariants({ size: 'sm' })}>
            <span>{t('media.network_drives.actions.add')}</span>
            <Plus size={18} />
          </ModalLink>
        </Heading>

        <div className="flex-1 overflow-auto px-1 py-1">
          <DataTable
            columns={columns}
            data={networkDrives.data}
            t={t}
            remoteTableOptions={remoteTableOptions}
          />
        </div>
      </Main>
    </AdminLayout>
  )
}
