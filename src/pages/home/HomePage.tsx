import { lazy, Suspense } from 'react'
import { EventsSection } from '@/features/events'
import { FacilitiesSection } from '@/features/facilities'
import { FeesSection } from '@/features/fees'
import { HeroSection } from '@/features/hero'
import { JoinSection } from '@/features/membership'
import { NewsSection } from '@/features/news'
import { PoolSection } from '@/features/pool'
import { PAGES } from '@/shared/seo/pages.mjs'
import { container, section } from '@/shared/ui/layout'
import { Reveal } from '@/shared/ui/Reveal'
import { SectionHeading } from '@/shared/ui/SectionHeading'

// Below the hero, so its gallery code stays out of the initial home bundle.
const PierReportSection = lazy(() =>
  import('@/features/pier').then((module) => ({
    default: module.PierReportSection,
  })),
)

// Same shape as the section while it loads: without it, everything below jumps down
// when the pier report arrives (it was most of the home page layout shift).
const pierPlaceholder = (
  <section aria-hidden="true" className={`bg-mist-50 ${section}`}>
    <div className={container}>
      <SectionHeading
        title="Hoy en el muelle"
        description="El último parte del personal del club: altura del río, condiciones y fotos."
      />
      <div className="mt-8 h-96 rounded-2xl bg-white motion-safe:animate-pulse" />
    </div>
  </section>
)

export function HomePage() {
  return (
    <>
      <title>{PAGES.home.title}</title>
      <meta name="description" content={PAGES.home.description} />
      <link rel="canonical" href={`${import.meta.env.VITE_SITE_URL}/`} />
      <HeroSection />
      <Reveal>
        <Suspense fallback={pierPlaceholder}>
          <PierReportSection />
        </Suspense>
      </Reveal>
      <Reveal>
        <FacilitiesSection />
      </Reveal>
      <Reveal>
        <EventsSection />
      </Reveal>
      <Reveal>
        <PoolSection />
      </Reveal>
      <Reveal>
        <FeesSection />
      </Reveal>
      <Reveal>
        <NewsSection />
      </Reveal>
      <Reveal>
        <JoinSection />
      </Reveal>
    </>
  )
}
