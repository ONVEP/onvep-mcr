import { useTranslation } from '#common/ui/hooks/use_translation'
import { GITHUB_URL, GithubIcon } from '#marketing/ui/components/github_icon'

import Container from '#marketing/ui/components/container'

export default function FooterSection() {
  const { t } = useTranslation()

  return (
    <footer className="border-t bg-background/50 backdrop-blur-xl">
      <Container className="flex flex-col items-center justify-between gap-4 py-10 md:flex-row">
        <div className="flex flex-col items-center gap-1 text-center md:items-start md:text-left">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} <span className="font-medium text-foreground">ONVEP</span>.{' '}
            {t('marketing.footer.license')}
          </p>
          <p className="text-xs text-muted-foreground/70">
            {t('marketing.footer.credit')}{' '}
            <a
              href="https://github.com/filipebraida/adonisjs-starter-kit"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4 hover:text-foreground"
            >
              {t('marketing.footer.credit_link')}
            </a>
          </p>
        </div>

        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <GithubIcon className="size-5" />
        </a>
      </Container>
    </footer>
  )
}
