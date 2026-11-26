import { container, section } from '@/shared/ui/layout'
import { SectionHeading } from '@/shared/ui/SectionHeading'
import { defaultFacilities } from '../content'
import { useFacilities } from '../hooks/useFacilities'
import { FacilityCard } from './FacilityCard'

// En móvil es un carrusel: cuatro fotos altas apiladas alargan demasiado la página.
const listClass =
  '-mx-4 mt-10 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4'
const itemClass = 'w-[78%] shrink-0 snap-start sm:w-auto'

export function FacilitiesSection() {
  const query = useFacilities()
  // A failed or empty read keeps the original content instead of an empty section.
  const content = query.isPending ? null : (query.data ?? defaultFacilities)
  return (
    <section id="instalaciones" className={section} aria-busy={query.isPending}>
      <div className={container}>
        {content ? (
          <>
            <SectionHeading
              title={content.title}
              description={content.description}
            />
            <ul
              tabIndex={0}
              aria-label="Instalaciones del club"
              className={`reveal-stagger ${listClass}`}
            >
              {content.cards.map((facility) => (
                <FacilityCard
                  key={facility.id}
                  facility={facility}
                  className={itemClass}
                />
              ))}
            </ul>
          </>
        ) : (
          // Same footprint as the loaded section, so nothing shifts when it arrives.
          <div role="status" aria-label="Cargando instalaciones">
            <div className="h-9 w-72 max-w-full animate-pulse rounded bg-mist-50 motion-reduce:animate-none sm:h-12" />
            <div className="mt-4 h-5 w-96 max-w-full animate-pulse rounded bg-mist-50 motion-reduce:animate-none" />
            <ul aria-hidden="true" className={listClass}>
              {defaultFacilities.cards.map((facility) => (
                <li
                  key={facility.id}
                  className={`${itemClass} aspect-[4/5] animate-pulse rounded-2xl bg-mist-50 motion-reduce:animate-none`}
                />
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
