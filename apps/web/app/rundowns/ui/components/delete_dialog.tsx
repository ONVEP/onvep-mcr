import { useForm } from '@inertiajs/react'
import { Trans } from 'react-i18next'
import { AlertTriangleIcon } from 'lucide-react'

import { ConfirmDialog } from '#common/ui/components/confirm_dialog'
import { useTranslation } from '#common/ui/hooks/use_translation'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  url: string
  name: string
  titleKey: string
  descriptionKey: string
}

/** Delete confirmation shared by rundowns and steps. */
export function DeleteDialog({ open, onOpenChange, url, name, titleKey, descriptionKey }: Props) {
  const { delete: destroy, processing } = useForm()
  const { t } = useTranslation()

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={() =>
        destroy(url, { preserveScroll: true, onSuccess: () => onOpenChange(false) })
      }
      disabled={processing}
      isLoading={processing}
      title={
        <span className="text-destructive flex items-center gap-2">
          <AlertTriangleIcon className="mr-1 inline-block stroke-destructive" size={18} />
          <span>{t(titleKey)}</span>
        </span>
      }
      desc={
        <Trans
          i18nKey={descriptionKey}
          values={{ name }}
          components={{ strong: <span className="font-bold" /> }}
        />
      }
      confirmText={t('rundowns.actions.delete')}
      destructive
    />
  )
}
