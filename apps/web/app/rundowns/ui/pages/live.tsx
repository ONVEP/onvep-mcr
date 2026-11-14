import AuthenticatedLayout from '#common/ui/components/authenticated_layout'
import { Main } from '#common/ui/components/main'
import { useTranslation } from '#common/ui/hooks/use_translation'

export default function LivePage() {
  const { t } = useTranslation()

  return (
    <AuthenticatedLayout breadcrumbs={[{ label: t('rundowns.live.title') }]}>
      <Main>
        <div className="flex flex-1 flex-col gap-6 py-6" />
      </Main>
    </AuthenticatedLayout>
  )
}
