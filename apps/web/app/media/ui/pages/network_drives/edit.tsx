import { useForm } from '@inertiajs/react'
import { Modal } from 'adonis-inertia-modal/react'

import { Button } from '@workspace/ui/components/button'
import { toast } from '@workspace/ui/hooks/use-toast'

import { urlFor } from '~/app/client'

import { useTranslation } from '#common/ui/hooks/use_translation'
import NetworkDriveFormFields, {
  type NetworkDriveFormData,
} from '#media/ui/components/network_drive_form_fields'

import type { InertiaProps } from '#core/ui/types'
import type { Data } from '@generated/data'

type PageProps = InertiaProps<{
  networkDrive: Data.Media.NetworkDrive.Variants['forEdit']
}>

export default function EditNetworkDrivePage({ networkDrive }: PageProps) {
  const { t } = useTranslation()

  const { data, setData, errors, put, processing, reset } = useForm<NetworkDriveFormData>({
    name: networkDrive.name,
    url: networkDrive.url,
    username: networkDrive.username,
    password: '',
  })

  return (
    <Modal maxWidth="md">
      {({ close }) => (
        <div className="space-y-4">
          <header className="text-left space-y-1">
            <h2 className="text-lg font-semibold">{t('media.network_drives.edit.title')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('media.network_drives.edit.description')}
            </p>
          </header>

          <form
            id="edit-network-drive-form"
            onSubmit={(e) => {
              e.preventDefault()
              put(urlFor('network_drives.update', { id: networkDrive.id }), {
                preserveScroll: true,
                onSuccess: () => {
                  close()
                  toast(t('media.network_drives.toast.saved'), { description: data.name })
                },
                onFinish: () => reset('password'),
              })
            }}
          >
            <NetworkDriveFormFields
              data={data}
              errors={errors}
              setData={(key, value) => setData(key, value)}
              isEdit
            />
          </form>

          <footer className="flex justify-end gap-2">
            <Button variant="outline" onClick={close}>
              {t('media.network_drives.actions.cancel')}
            </Button>
            <Button type="submit" form="edit-network-drive-form" disabled={processing}>
              {t('media.network_drives.actions.save')}
            </Button>
          </footer>
        </div>
      )}
    </Modal>
  )
}
