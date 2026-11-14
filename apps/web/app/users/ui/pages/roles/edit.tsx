import { useForm } from '@inertiajs/react'
import { Modal } from 'adonis-inertia-modal/react'

import { Button } from '@workspace/ui/components/button'
import { toast } from '@workspace/ui/hooks/use-toast'

import { urlFor } from '~/app/client'

import { useTranslation } from '#common/ui/hooks/use_translation'
import RoleFormFields, { type RoleFormData } from '#users/ui/components/role_form_fields'
import { roleLabel } from '#users/ui/components/users_types'

import type { InertiaProps } from '#core/ui/types'
import type { Data } from '@generated/data'

type PageProps = InertiaProps<{
  role: Data.Users.Role.Variants['forEdit']
}>

export default function EditRolePage({ role }: PageProps) {
  const { t } = useTranslation()

  const { data, setData, errors, put, processing } = useForm<RoleFormData>({
    name: role.name,
    permissions: role.permissions,
  })

  return (
    <Modal maxWidth="lg">
      {({ close }) => (
        <div className="space-y-4">
          <header className="text-left space-y-1">
            <h2 className="text-lg font-semibold">{t('users.roles_page.edit.title')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('users.roles_page.edit.description', { name: roleLabel(t, role.name) })}
            </p>
          </header>

          <form
            id="edit-role-form"
            onSubmit={(e) => {
              e.preventDefault()
              put(urlFor('roles.update', { id: role.id }), {
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
              nameLocked={role.isSystem}
            />
          </form>

          <footer className="flex justify-end gap-2">
            <Button variant="outline" onClick={close}>
              {t('users.roles_page.actions.cancel')}
            </Button>
            <Button type="submit" form="edit-role-form" disabled={processing}>
              {t('users.roles_page.actions.save')}
            </Button>
          </footer>
        </div>
      )}
    </Modal>
  )
}
