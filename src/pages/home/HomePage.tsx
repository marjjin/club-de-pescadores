import { EventsSection } from '@/features/events'
import { FacilitiesSection } from '@/features/facilities'
import { HeroSection } from '@/features/hero'
import { JoinSection } from '@/features/membership'
import { NewsSection } from '@/features/news'
import { PoolSection } from '@/features/pool'
import { Reveal } from '@/shared/ui/Reveal'

export function HomePage() {
  return (
    <>
      <title>Club de Pescadores San Nicolás</title>
      <link rel="canonical" href={`${import.meta.env.VITE_SITE_URL}/`} />
      <HeroSection />
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
