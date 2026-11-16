import MarketingLayout from '#marketing/ui/components/marketing_layout'
import HeroSection from '#marketing/ui/components/hero'
import FeaturesSection from '#marketing/ui/components/features'
import HowItWorksSection from '#marketing/ui/components/how_it_works'
import CtaSection from '#marketing/ui/components/cta'

export default function Page() {
  return (
    <MarketingLayout>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CtaSection />
    </MarketingLayout>
  )
}
