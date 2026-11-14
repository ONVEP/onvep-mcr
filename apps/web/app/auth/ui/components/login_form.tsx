import { Link } from '@adonisjs/inertia/react'
import { usePage } from '@inertiajs/react'

import { Field, FieldError, Form } from '#common/ui/components/form'
import { useTranslation } from '#common/ui/hooks/use_translation'

import { cn } from '@workspace/ui/lib/utils'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { FieldSet, FieldGroup, FieldLabel } from '@workspace/ui/components/field'

import { PasswordInput } from '@workspace/ui/components/password-input'

export function LoginForm({ className }: { className?: string }) {
  const { t } = useTranslation()

  const { error: errorMessage } = usePage().flash

  return (
    <Form
      route="auth.sign_in.handle"
      resetOnSuccess={['password']}
      resetOnError={['password']}
      className={cn('flex flex-col gap-6', className)}
    >
      {({ processing }) => (
        <>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold">{t('auth.signin.title')}</h1>
            <p className="text-balance text-sm text-muted-foreground">
              {t('auth.signin.description')}
            </p>
          </div>

          <FieldSet>
            <FieldGroup>
              <Field name="email">
                <FieldLabel htmlFor="email">{t('auth.signin.form.email.label')}</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t('auth.signin.form.email.placeholder')}
                  required
                />
                <FieldError />
              </Field>
              <Field name="password">
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">{t('auth.signin.form.password.label')}</FieldLabel>
                  <Link
                    route="auth.forgot_password.show"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    {t('auth.signin.actions.forgot_password')}
                  </Link>
                </div>
                <PasswordInput
                  id="password"
                  name="password"
                  placeholder={t('auth.signin.form.password.placeholder')}
                  required
                />
                <FieldError />
              </Field>

              <Field orientation="responsive">
                <Button type="submit" disabled={processing}>
                  {t('auth.signin.actions.submit')}
                </Button>
              </Field>

              <FieldError errors={errorMessage ? [{ message: errorMessage }] : []} />
            </FieldGroup>
          </FieldSet>
        </>
      )}
    </Form>
  )
}
