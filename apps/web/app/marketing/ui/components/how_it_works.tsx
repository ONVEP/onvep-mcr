import { useTranslation } from '#common/ui/hooks/use_translation'

import Container from '#marketing/ui/components/container'

const STEPS = ['prepare', 'connect', 'go_live'] as const

export default function HowItWorksSection() {
  const { t } = useTranslation()

  return (
    <section id="how-it-works" className="scroll-mt-16 border-t bg-muted/30 py-20 lg:py-28">
      <Container>
        <div className="mx-auto mb-12 flex max-w-2xl flex-col gap-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-balance md:text-4xl">
            {t('marketing.how_it_works.title')}
          </h2>
          <p className="text-muted-foreground text-balance md:text-lg">
            {t('marketing.how_it_works.description')}
          </p>
        </div>

        <ol className="grid gap-10 md:grid-cols-3 md:gap-8">
          {STEPS.map((step, index) => (
            <li key={step} className="flex flex-col items-center gap-3 text-center">
              <span className="flex size-12 items-center justify-center rounded-full border-2 border-primary text-lg font-bold text-primary">
                {index + 1}
              </span>
              <h3 className="text-lg font-semibold">{t(`marketing.how_it_works.${step}.title`)}</h3>
              <p className="max-w-xs text-sm text-muted-foreground">
                {t(`marketing.how_it_works.${step}.description`)}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}
