import { Plus } from 'lucide-react'
import { ModalLink } from 'adonis-inertia-modal/react'

import { Badge } from '@workspace/ui/components/badge'
import { buttonVariants } from '@workspace/ui/components/button'
import { ColumnDef, DataTable } from '@workspace/ui/components/data-table'

import type { InertiaProps } from '#core/ui/types'

import AdminLayout from '#common/ui/components/admin_layout'
import Heading from '#common/ui/components/heading'
import { Main } from '#common/ui/components/main'
import { useTranslation } from '#common/ui/hooks/use_translation'
import { urlFor } from '~/app/client'

import { ALL_PERMISSIONS } from '#users/enums/permission'
import { RolesRowActions } from '#users/ui/components/roles_row_actions'
import { roleLabel } from '#users/ui/components/users_types'

import type { Data } from '@generated/data'

type RoleRow = Data.Users.Role.Variants['forList']

type PageProps = InertiaProps<{
  roles: RoleRow[]
}>

export default function ListRolesPage({ roles }: PageProps) {
  const { t } = useTranslation()

  const columns: ColumnDef<RoleRow>[] = [
    {
      id: 'name',
      header: t('users.roles_page.table.columns.name'),
      accessorKey: 'name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{roleLabel(t, row.original.name)}</span>
          {row.original.isSystem && (
            <Badge variant="secondary">{t('users.roles_page.table.system')}</Badge>
          )}
        </div>
      ),
    },
    {
      id: 'permissions',
      header: t('users.roles_page.table.columns.permissions'),
      cell: ({ row }) =>
        t('users.roles_page.table.permissions_count', {
          count: row.original.permissions.length,
          total: ALL_PERMISSIONS.length,
        }),
    },
    {
      id: 'usersCount',
      header: t('users.roles_page.table.columns.users'),
      accessorKey: 'usersCount',
      meta: { columnClasses: 'hidden sm:table-cell' },
    },
    {
      id: 'actions',
      meta: { columnClasses: 'w-[52px]' },
      cell: RolesRowActions,
    },
  ]

  return (
    <AdminLayout breadcrumbs={[{ label: t('users.roles_page.page.title') }]}>
      <Main>
        <Heading
          title={t('users.roles_page.page.title')}
          description={t('users.roles_page.page.description')}
        >
          <ModalLink href={urlFor('roles.create')} className={buttonVariants({ size: 'sm' })}>
            <span>{t('users.roles_page.actions.add')}</span>
            <Plus size={18} />
          </ModalLink>
        </Heading>

        <div className="flex-1 overflow-auto px-1 py-1">
          <DataTable columns={columns} data={roles} t={t} />
        </div>
      </Main>
    </AdminLayout>
  )
}
