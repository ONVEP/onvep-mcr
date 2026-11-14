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
  currentRow: Data.Media.NetworkDrive.Variants['forList']
}

export function NetworkDrivesDeleteDialog({ open, onOpenChange, currentRow }: Props) {
  const { delete: destroy, processing } = useForm()
  const { t } = useTranslation()

  const handleDelete = () => {
    destroy(urlFor('network_drives.destroy', { id: currentRow.id }), {
      preserveScroll: true,
      onSuccess: () => {
        onOpenChange(false)
        toast(t('media.network_drives.delete.toast'), { description: currentRow.name })
      },
    })
  }

  const title = useMemo(
    () => (
      <span className="text-destructive flex items-center gap-2">
        <AlertTriangleIcon className="mr-1 inline-block stroke-destructive" size={18} />
        <span>{t('media.network_drives.delete.title')}</span>
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
          i18nKey="media.network_drives.delete.description"
          values={{ name: currentRow.name }}
          components={{ strong: <span className="font-bold" /> }}
        />
      }
      confirmText={t('media.network_drives.delete.confirm_button')}
      destructive
    />
  )
}
