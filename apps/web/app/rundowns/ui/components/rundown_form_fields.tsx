import { Field, FieldLabel } from '@workspace/ui/components/field'
import { FieldErrorBag } from '@workspace/ui/components/field-error-bag'
import { Input } from '@workspace/ui/components/input'

import { useTranslation } from '#common/ui/hooks/use_translation'

export type RundownFormData = {
  name: string
  startTime: string
}

interface Props {
  data: RundownFormData
  errors: Partial<Record<keyof RundownFormData, string>>
  setData: (key: keyof RundownFormData, value: string) => void
}

export default function RundownFormFields({ data, errors, setData }: Props) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <Field>
        <FieldLabel htmlFor="name">{t('rundowns.form.name')}</FieldLabel>
        <Input
          id="name"
          value={data.name}
          onChange={(e) => setData('name', e.target.value)}
          className={errors?.name ? 'border-destructive' : ''}
        />
        <FieldErrorBag errors={errors} field="name" />
      </Field>

      <Field>
        <FieldLabel htmlFor="startTime">{t('rundowns.form.start_time')}</FieldLabel>
        <Input
          id="startTime"
          type="time"
          step={1}
          value={data.startTime}
          onChange={(e) => setData('startTime', e.target.value)}
          className={errors?.startTime ? 'border-destructive' : ''}
        />
        <FieldErrorBag errors={errors} field="startTime" />
      </Field>
    </div>
  )
}
