import { useForm } from '@inertiajs/react'
import { Modal } from 'adonis-inertia-modal/react'

import { Button } from '@workspace/ui/components/button'
import { toast } from '@workspace/ui/hooks/use-toast'

import { urlFor } from '~/app/client'

import { useTranslation } from '#common/ui/hooks/use_translation'
import RoleFormFields, { type RoleFormData } from '#users/ui/components/role_form_fields'

export default function CreateRolePage() {
  const { t } = useTranslation()

  const { data, setData, errors, post, processing } = useForm<RoleFormData>({
    name: '',
    permissions: [],
  })

  return (
    <Modal maxWidth="lg">
      {({ close }) => (
        <div className="space-y-4">
          <header className="text-left space-y-1">
            <h2 className="text-lg font-semibold">{t('users.roles_page.create.title')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('users.roles_page.create.description')}
            </p>
          </header>

          <form
            id="create-role-form"
            onSubmit={(e) => {
              e.preventDefault()
              post(urlFor('roles.store'), {
                preserveScroll: true,
                onSuccess: () => {
                  close()
                  toast(t('users.roles_page.toast.saved'), { description: data.name })
                },
              })
            }}
          >
            <RoleFormFields
              data={data}
              errors={errors}
              setName={(value) => setData('name', value)}
              setPermissions={(value) => setData('permissions', value)}
            />
          </form>

          <footer className="flex justify-end gap-2">
            <Button variant="outline" onClick={close}>
              {t('users.roles_page.actions.cancel')}
            </Button>
            <Button type="submit" form="create-role-form" disabled={processing}>
              {t('users.roles_page.actions.add')}
            </Button>
          </footer>
        </div>
      )}
    </Modal>
  )
}
