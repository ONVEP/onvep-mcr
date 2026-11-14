import { useForm } from '@inertiajs/react'
import { Modal } from 'adonis-inertia-modal/react'

import { Button } from '@workspace/ui/components/button'

import { urlFor } from '~/app/client'

import { useTranslation } from '#common/ui/hooks/use_translation'
import RundownFormFields, {
  type RundownFormData,
} from '#rundowns/ui/components/rundown_form_fields'

export default function CreateRundownPage() {
  const { t } = useTranslation()

  const { data, setData, errors, post, processing } = useForm<RundownFormData>({
    name: '',
    startTime: '00:00:00',
  })

  return (
    <Modal maxWidth="md">
      {({ close }) => (
        <div className="space-y-4">
          <header className="text-left space-y-1">
            <h2 className="text-lg font-semibold">{t('rundowns.create.title')}</h2>
          </header>

          <form
            id="create-rundown-form"
            onSubmit={(e) => {
              e.preventDefault()
              post(urlFor('rundowns.store'), { onSuccess: () => close() })
            }}
          >
            <RundownFormFields data={data} errors={errors} setData={setData} />
          </form>

          <footer className="flex justify-end gap-2">
            <Button variant="outline" onClick={close}>
              {t('rundowns.actions.cancel')}
            </Button>
            <Button type="submit" form="create-rundown-form" disabled={processing}>
              {t('rundowns.actions.add')}
            </Button>
          </footer>
        </div>
      )}
    </Modal>
  )
}
