import { EventsSection } from '../features/events'
import { FacilitiesSection } from '../features/facilities'
import { HeroSection } from '../features/hero'
import { JoinSection } from '../features/membership'
import { NewsSection } from '../features/news'
import { PoolSection } from '../features/pool'
import { Footer } from '../shared/layout/Footer'
import { Header } from '../shared/layout/Header'
import { WhatsAppButton } from '../shared/layout/WhatsAppButton'
import { Reveal } from '../shared/ui/Reveal'
import { Providers } from './Providers'

export function App() {
  return (
    <Providers>
      <a
        href="#contenido"
        className="sr-only font-bold focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-30 focus:rounded-md focus:bg-white focus:px-4 focus:py-2"
      >
        Saltar al contenido
      </a>
      <Header />
      <main id="contenido">
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
      </main>
      <Footer />
      <WhatsAppButton />
    </Providers>
  )
}
