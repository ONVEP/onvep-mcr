import {
  BracesIcon,
  KeyboardIcon,
  LayersIcon,
  ListOrderedIcon,
  UsersIcon,
  WorkflowIcon,
} from 'lucide-react'

import { useTranslation } from '#common/ui/hooks/use_translation'

import Container from '#marketing/ui/components/container'

const FEATURES = [
  { key: 'rundowns', icon: ListOrderedIcon },
  { key: 'graphics', icon: LayersIcon },
  { key: 'context', icon: BracesIcon },
  { key: 'companion', icon: KeyboardIcon },
  { key: 'node_red', icon: WorkflowIcon },
  { key: 'team', icon: UsersIcon },
] as const

export default function FeaturesSection() {
  const { t } = useTranslation()

  return (
    <section id="features" className="scroll-mt-16 border-t py-20 lg:py-28">
      <Container>
        <div className="mx-auto mb-12 flex max-w-2xl flex-col gap-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-balance md:text-4xl">
            {t('marketing.features.title')}
          </h2>
          <p className="text-muted-foreground text-balance md:text-lg">
            {t('marketing.features.description')}
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ key, icon: Icon }) => (
            <div
              key={key}
              className="flex flex-col gap-3 rounded-2xl border bg-card p-6 transition-colors hover:border-primary/40"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <h3 className="font-semibold">{t(`marketing.features.${key}.title`)}</h3>
              <p className="text-sm text-muted-foreground">
                {t(`marketing.features.${key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
