import { Link } from '@adonisjs/inertia/react'

import { Button } from '@workspace/ui/components/button'

import { AppLogoMark } from '#common/ui/components/app_logo'
import { GithubIcon } from '#marketing/ui/components/github_icon'

import Container from '#marketing/ui/components/container'

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-32">
      <Container className="relative z-10">
        <div className="flex flex-col gap-10 text-center items-center">
          <div className="relative flex flex-col gap-6 items-center max-w-3xl">
            <div
              style={{
                transform: 'translate(-50%, -50%)',
              }}
              className="absolute left-1/2 top-1/2 -z-10 mx-auto size-[600px] rounded-full border p-16 opacity-40 [mask-image:linear-gradient(to_top,transparent,transparent,white,white,white,transparent,transparent)] md:size-[1000px] md:p-32"
            >
              <div className="size-full rounded-full border p-16 md:p-32 bg-gradient-to-br from-primary/20 to-transparent blur-3xl" />
            </div>

            <AppLogoMark className="size-24 md:size-32" />

            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
              ONVEP MCR
            </h1>

            <p className="text-lg text-muted-foreground md:text-xl text-balance max-w-2xl">
              Automate and enpower your live production
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <Button size="lg" className="h-12 px-8 text-base rounded-full" asChild>
                <Link route="auth.sign_in.show">Get Started</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 text-base rounded-full gap-2"
                asChild
              >
                <a
                  href="https://github.com/onvep/onvep-mcr"
                  target="_blank"
                  rel="noreferrer"
                >
                  <GithubIcon className="size-5" />
                  Star on GitHub
                </a>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
