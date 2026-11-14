import { Checkbox } from '@workspace/ui/components/checkbox'
import { Field, FieldDescription, FieldLabel } from '@workspace/ui/components/field'
import { FieldErrorBag } from '@workspace/ui/components/field-error-bag'
import { Input } from '@workspace/ui/components/input'

import { useTranslation } from '#common/ui/hooks/use_translation'
import { PERMISSIONS, type Permission } from '#users/enums/permission'

export type RoleFormData = {
  name: string
  permissions: Permission[]
}

type PermissionKey = keyof typeof PERMISSIONS

// Grouped by the `<group>.<action>` prefix of each permission value.
const PERMISSION_GROUPS = (Object.keys(PERMISSIONS) as PermissionKey[]).reduce<
  Record<string, PermissionKey[]>
>((groups, key) => {
  const group = PERMISSIONS[key].split('.')[0]
  ;(groups[group] ??= []).push(key)
  return groups
}, {})

interface Props {
  data: RoleFormData
  errors: Partial<Record<string, string>>
  setName: (value: string) => void
  setPermissions: (value: Permission[]) => void
  nameLocked?: boolean
}

export default function RoleFormFields({
  data,
  errors,
  setName,
  setPermissions,
  nameLocked,
}: Props) {
  const { t } = useTranslation()

  const toggle = (permission: Permission, checked: boolean) => {
    setPermissions(
      checked
        ? [...data.permissions, permission]
        : data.permissions.filter((value) => value !== permission)
    )
  }

  return (
    <div className="space-y-6">
      <Field>
        <FieldLabel htmlFor="name">{t('users.roles_page.form.name.label')}</FieldLabel>
        <Input
          id="name"
          placeholder={t('users.roles_page.form.name.placeholder')}
          value={data.name}
          disabled={nameLocked}
          onChange={(e) => setName(e.target.value)}
          className={errors?.name ? 'border-destructive' : ''}
        />
        {nameLocked && (
          <FieldDescription>{t('users.roles_page.form.name.locked_hint')}</FieldDescription>
        )}
        <FieldErrorBag errors={errors} field="name" />
      </Field>

      <div className="space-y-4">
        <div className="text-sm font-medium">{t('users.roles_page.form.permissions.label')}</div>
        {Object.entries(PERMISSION_GROUPS).map(([group, keys]) => (
          <fieldset key={group} className="space-y-2">
            <legend className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t(`users.permission_groups.${group}`)}
            </legend>
            {keys.map((key) => {
              const permission = PERMISSIONS[key]
              const id = `permission-${key}`
              return (
                <label key={key} htmlFor={id} className="flex items-center gap-3 text-sm">
                  <Checkbox
                    id={id}
                    checked={data.permissions.includes(permission)}
                    onCheckedChange={(checked) => toggle(permission, checked === true)}
                  />
                  <span>{t(`users.permissions.${key}`)}</span>
                </label>
              )
            })}
          </fieldset>
        ))}
        <FieldErrorBag errors={errors} field="permissions" />
      </div>
    </div>
  )
}
