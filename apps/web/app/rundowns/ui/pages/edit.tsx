import { useForm } from '@inertiajs/react'
import { Modal } from 'adonis-inertia-modal/react'

import { Button } from '@workspace/ui/components/button'
import { toast } from '@workspace/ui/hooks/use-toast'

import { urlFor } from '~/app/client'

import { useTranslation } from '#common/ui/hooks/use_translation'
import RundownFormFields, {
  type RundownFormData,
} from '#rundowns/ui/components/rundown_form_fields'

import type { InertiaProps } from '#core/ui/types'
import type { Data } from '@generated/data'

type PageProps = InertiaProps<{
  rundown: Data.Rundowns.Rundown.Variants['forEdit']
}>

export default function EditRundownPage({ rundown }: PageProps) {
  const { t } = useTranslation()

  const { data, setData, errors, put, processing } = useForm<RundownFormData>({
    name: rundown.name,
    startTime: rundown.startTime,
  })

  return (
    <Modal maxWidth="md">
      {({ close }) => (
        <div className="space-y-4">
          <header className="text-left space-y-1">
            <h2 className="text-lg font-semibold">{t('rundowns.edit.title')}</h2>
          </header>

          <form
            id="edit-rundown-form"
            onSubmit={(e) => {
              e.preventDefault()
              put(urlFor('rundowns.update', { id: rundown.id }), {
                preserveScroll: true,
                onSuccess: () => {
                  close()
                  toast(t('rundowns.toast.saved'), { description: data.name })
                },
              })
            }}
          >
            <RundownFormFields data={data} errors={errors} setData={setData} />
          </form>

          <footer className="flex justify-end gap-2">
            <Button variant="outline" onClick={close}>
              {t('rundowns.actions.cancel')}
            </Button>
            <Button type="submit" form="edit-rundown-form" disabled={processing}>
              {t('rundowns.actions.save')}
            </Button>
          </footer>
        </div>
      )}
    </Modal>
  )
}
