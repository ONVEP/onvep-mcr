import { useForm } from '@inertiajs/react'
import { useMemo } from 'react'
import { Trans } from 'react-i18next'
import { AlertTriangleIcon } from 'lucide-react'

import { toast } from '@workspace/ui/hooks/use-toast'

import { ConfirmDialog } from '#common/ui/components/confirm_dialog'
import { useTranslation } from '#common/ui/hooks/use_translation'
import { urlFor } from '~/app/client'

import type { Data } from '@generated/data'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Data.Users.Role.Variants['forList']
}

export function RolesDeleteDialog({ open, onOpenChange, currentRow }: Props) {
  const { delete: destroy, processing } = useForm()
  const { t } = useTranslation()

  const handleDelete = () => {
    destroy(urlFor('roles.destroy', { id: currentRow.id }), {
      preserveScroll: true,
      onSuccess: () => {
        onOpenChange(false)
        toast(t('users.roles_page.delete.toast'), { description: currentRow.name })
      },
    })
  }

  const title = useMemo(
    () => (
      <span className="text-destructive flex items-center gap-2">
        <AlertTriangleIcon className="mr-1 inline-block stroke-destructive" size={18} />
        <span>{t('users.roles_page.delete.title')}</span>
      </span>
    ),
    [t]
  )

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDelete}
      disabled={processing}
      isLoading={processing}
      title={title}
      desc={
        <Trans
          i18nKey="users.roles_page.delete.description"
          values={{ name: currentRow.name }}
          components={{ strong: <span className="font-bold" /> }}
        />
      }
      confirmText={t('users.roles_page.delete.confirm_button')}
      destructive
    />
  )
}
