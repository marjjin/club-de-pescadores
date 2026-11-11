import { lazy, Suspense } from 'react'
import { EventsSection } from '@/features/events'
import { FacilitiesSection } from '@/features/facilities'
import { HeroSection } from '@/features/hero'
import { JoinSection } from '@/features/membership'
import { NewsSection } from '@/features/news'
import { PoolSection } from '@/features/pool'
import { Reveal } from '@/shared/ui/Reveal'

// Below the hero, so its gallery code stays out of the initial home bundle.
const PierReportSection = lazy(() =>
  import('@/features/pier').then((module) => ({
    default: module.PierReportSection,
  })),
)

export function HomePage() {
  return (
    <>
      <title>Club de Pescadores San Nicolás</title>
      <link rel="canonical" href={`${import.meta.env.VITE_SITE_URL}/`} />
      <HeroSection />
      <Reveal>
        <Suspense fallback={null}>
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
        <NewsSection />
      </Reveal>
      <Reveal>
        <JoinSection />
      </Reveal>
    </>
  )
}
