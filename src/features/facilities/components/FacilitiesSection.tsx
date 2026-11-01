import { SectionHeading } from '../../../shared/ui/SectionHeading'
import { facilities } from '../data'

export function FacilitiesSection() {
  return (
    <section id="instalaciones" className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          title="Un espacio pensado para los socios"
          description="Todo lo que necesitás para disfrutar del río, en familia o con amigos."
        />
        {/* En móvil es un carrusel: cuatro fotos altas apiladas alargan demasiado la página. */}
        <ul
          tabIndex={0}
          aria-label="Instalaciones del club"
          className="-mx-4 mt-10 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4"
        >
          {facilities.map(({ name, description, imageUrl, imageAlt }) => (
            <li
              key={name}
              className="group w-[78%] shrink-0 snap-start sm:w-auto"
            >
              <div className="overflow-hidden rounded-md">
                <img
                  src={imageUrl}
                  width="600"
                  height="750"
                  loading="lazy"
                  alt={imageAlt}
                  className="aspect-[4/5] w-full object-cover transition-[scale] duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none"
                />
              </div>
              <h3 className="mt-4 text-lg font-bold">{name}</h3>
              <p className="mt-1 text-ink-600">{description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
