import AuthenticatedLayout from '#common/ui/components/authenticated_layout'
import { Main } from '#common/ui/components/main'
import { useTranslation } from '#common/ui/hooks/use_translation'

import type { InertiaProps } from '#core/ui/types'

type PageProps = InertiaProps<{}>

export default function Page({}: PageProps) {
  const { t } = useTranslation()

  return (
    <AuthenticatedLayout breadcrumbs={[{ label: t('analytics.dashboard.breadcrumb') }]}>
      <Main>
        <div className="flex flex-1 flex-col gap-6 py-6"></div>
      </Main>
    </AuthenticatedLayout>
  )
}
