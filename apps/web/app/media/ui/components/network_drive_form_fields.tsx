import { Field, FieldDescription, FieldLabel } from '@workspace/ui/components/field'
import { FieldErrorBag } from '@workspace/ui/components/field-error-bag'
import { Input } from '@workspace/ui/components/input'
import { PasswordInput } from '@workspace/ui/components/password-input'

import { useTranslation } from '#common/ui/hooks/use_translation'

export type NetworkDriveFormData = {
  name: string
  url: string
  username: string
  password: string
}

interface Props {
  data: NetworkDriveFormData
  errors: Partial<Record<keyof NetworkDriveFormData, string>>
  setData: (key: keyof NetworkDriveFormData, value: string) => void
  isEdit?: boolean
}

/** Shared form fields for create and edit modals. */
export default function NetworkDriveFormFields({ data, errors, setData, isEdit }: Props) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <Field>
        <FieldLabel htmlFor="name">{t('media.network_drives.form.name.label')}</FieldLabel>
        <Input
          id="name"
          placeholder={t('media.network_drives.form.name.placeholder')}
          value={data.name}
          onChange={(e) => setData('name', e.target.value)}
          className={errors?.name ? 'border-destructive' : ''}
        />
        <FieldErrorBag errors={errors} field="name" />
      </Field>

      <Field>
        <FieldLabel htmlFor="url">{t('media.network_drives.form.url.label')}</FieldLabel>
        <Input
          id="url"
          placeholder="smb://nas.network/Storage"
          value={data.url}
          onChange={(e) => setData('url', e.target.value)}
          className={errors?.url ? 'border-destructive' : ''}
        />
        <FieldErrorBag errors={errors} field="url" />
      </Field>

      <Field>
        <FieldLabel htmlFor="username">{t('media.network_drives.form.username.label')}</FieldLabel>
        <Input
          id="username"
          autoComplete="off"
          value={data.username}
          onChange={(e) => setData('username', e.target.value)}
          className={errors?.username ? 'border-destructive' : ''}
        />
        <FieldErrorBag errors={errors} field="username" />
      </Field>

      <Field>
        <FieldLabel htmlFor="password">{t('media.network_drives.form.password.label')}</FieldLabel>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          value={data.password}
          onChange={(e) => setData('password', e.target.value)}
          className={errors?.password ? 'border-destructive' : ''}
        />
        {isEdit && (
          <FieldDescription>{t('media.network_drives.form.password.keep_hint')}</FieldDescription>
        )}
        <FieldErrorBag errors={errors} field="password" />
      </Field>
    </div>
  )
}
