import { Link } from '@adonisjs/inertia/react'

import { Button } from '@workspace/ui/components/button'

import { useTranslation } from '#common/ui/hooks/use_translation'
import { GITHUB_URL, GithubIcon } from '#marketing/ui/components/github_icon'

import Container from '#marketing/ui/components/container'

export default function CtaSection() {
  const { t } = useTranslation()

  return (
    <section className="border-t py-20 lg:py-28">
      <Container>
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 rounded-3xl border bg-gradient-to-br from-primary/10 to-transparent px-6 py-14 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-balance md:text-4xl">
            {t('marketing.cta.title')}
          </h2>
          <p className="max-w-xl text-muted-foreground text-balance md:text-lg">
            {t('marketing.cta.description')}
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
            <Button size="lg" className="h-12 px-8 text-base rounded-full" asChild>
              <Link route="auth.sign_in.show">{t('marketing.cta.get_started')}</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 text-base rounded-full gap-2"
              asChild
            >
              <a href={GITHUB_URL} target="_blank" rel="noreferrer">
                <GithubIcon className="size-5" />
                {t('marketing.cta.github')}
              </a>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  )
}
