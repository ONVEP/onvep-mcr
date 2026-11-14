import { useState } from 'react'
import { EditIcon, EllipsisIcon, TrashIcon } from 'lucide-react'
import { ModalLink } from 'adonis-inertia-modal/react'

import { Button } from '@workspace/ui/components/button'
import { DataTableRowActionsProps } from '@workspace/ui/components/data-table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'

import { urlFor } from '~/app/client'
import { useTranslation } from '#common/ui/hooks/use_translation'
import { ROLES } from '#users/enums/role'

import { RolesDeleteDialog } from '#users/ui/components/roles_delete_dialog'

import type { Data } from '@generated/data'

// Mirrors RolePolicy: admin is read-only; system and assigned roles can't be deleted.
export function RolesRowActions({
  row,
}: DataTableRowActionsProps<Data.Users.Role.Variants['forList']>) {
  const { t } = useTranslation()
  const [openDelete, setOpenDelete] = useState(false)

  const role = row.original
  const canEdit = role.name !== ROLES.ADMIN
  const canDelete = !role.isSystem && role.usersCount === 0

  if (!canEdit && !canDelete) return null

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
            <EllipsisIcon className="h-4 w-4" />
            <span className="sr-only">{t('users.roles_page.row_actions.open_menu')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          {canEdit && (
            <DropdownMenuItem asChild>
              <ModalLink
                href={urlFor('roles.edit', { id: role.id })}
                className="flex w-full items-center justify-between"
              >
                {t('users.roles_page.row_actions.edit')}
                <DropdownMenuShortcut>
                  <EditIcon size={16} />
                </DropdownMenuShortcut>
              </ModalLink>
            </DropdownMenuItem>
          )}
          {canDelete && (
            <>
              {canEdit && <DropdownMenuSeparator />}
              <DropdownMenuItem onClick={() => setOpenDelete(true)} className="text-destructive">
                {t('users.roles_page.row_actions.delete')}
                <DropdownMenuShortcut>
                  <TrashIcon size={16} />
                </DropdownMenuShortcut>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {canDelete && (
        <RolesDeleteDialog open={openDelete} onOpenChange={setOpenDelete} currentRow={role} />
      )}
    </>
  )
}
