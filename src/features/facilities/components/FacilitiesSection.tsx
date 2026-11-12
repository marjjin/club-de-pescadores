import { container, section } from '@/shared/ui/layout'
import { SectionHeading } from '@/shared/ui/SectionHeading'
import { facilities } from '../content'

export function FacilitiesSection() {
  return (
    <section id="instalaciones" className={section}>
      <div className={container}>
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
              className="group relative isolate w-[78%] shrink-0 snap-start overflow-hidden rounded-2xl bg-navy-950 shadow-card sm:w-auto"
            >
              <img
                src={imageUrl}
                width="600"
                height="750"
                loading="lazy"
                alt={imageAlt}
                className="aspect-[4/5] w-full object-cover transition-[scale] duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none"
              />
              {/* Gradient only behind the caption, so the photo keeps its colour. */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-950/90 via-navy-950/60 to-transparent px-5 pt-16 pb-5 text-white">
                <h3 className="font-display text-2xl tracking-wide uppercase">
                  {name}
                </h3>
                <p className="mt-1 text-sm leading-5 text-white/85">
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
