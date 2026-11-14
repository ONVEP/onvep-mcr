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

import { NetworkDrivesDeleteDialog } from '#media/ui/components/network_drives_delete_dialog'

import type { Data } from '@generated/data'

export function NetworkDrivesRowActions({
  row,
}: DataTableRowActionsProps<Data.Media.NetworkDrive.Variants['forList']>) {
  const { t } = useTranslation()
  const [openDelete, setOpenDelete] = useState(false)

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
            <EllipsisIcon className="h-4 w-4" />
            <span className="sr-only">{t('media.network_drives.row_actions.open_menu')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem asChild>
            <ModalLink
              href={urlFor('network_drives.edit', { id: row.original.id })}
              className="flex w-full items-center justify-between"
            >
              {t('media.network_drives.row_actions.edit')}
              <DropdownMenuShortcut>
                <EditIcon size={16} />
              </DropdownMenuShortcut>
            </ModalLink>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpenDelete(true)} className="text-destructive">
            {t('media.network_drives.row_actions.delete')}
            <DropdownMenuShortcut>
              <TrashIcon size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <NetworkDrivesDeleteDialog
        open={openDelete}
        onOpenChange={setOpenDelete}
        currentRow={row.original}
      />
    </>
  )
}
