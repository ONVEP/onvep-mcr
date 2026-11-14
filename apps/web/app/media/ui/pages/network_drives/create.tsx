import { useForm } from '@inertiajs/react'
import { Modal } from 'adonis-inertia-modal/react'

import { Button } from '@workspace/ui/components/button'
import { toast } from '@workspace/ui/hooks/use-toast'

import { urlFor } from '~/app/client'

import { useTranslation } from '#common/ui/hooks/use_translation'
import NetworkDriveFormFields, {
  type NetworkDriveFormData,
} from '#media/ui/components/network_drive_form_fields'

export default function CreateNetworkDrivePage() {
  const { t } = useTranslation()

  const { data, setData, errors, post, processing, reset } = useForm<NetworkDriveFormData>({
    name: '',
    url: '',
    username: '',
    password: '',
  })

  return (
    <Modal maxWidth="md">
      {({ close }) => (
        <div className="space-y-4">
          <header className="text-left space-y-1">
            <h2 className="text-lg font-semibold">{t('media.network_drives.create.title')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('media.network_drives.create.description')}
            </p>
          </header>

          <form
            id="create-network-drive-form"
            onSubmit={(e) => {
              e.preventDefault()
              post(urlFor('network_drives.store'), {
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
            />
          </form>

          <footer className="flex justify-end gap-2">
            <Button variant="outline" onClick={close}>
              {t('media.network_drives.actions.cancel')}
            </Button>
            <Button type="submit" form="create-network-drive-form" disabled={processing}>
              {t('media.network_drives.actions.add')}
            </Button>
          </footer>
        </div>
      )}
    </Modal>
  )
}
