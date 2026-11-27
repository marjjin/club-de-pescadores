import hero960 from '@/shared/assets/images/hero-960.webp'
import hero1920 from '@/shared/assets/images/hero-1920.webp'
import heroMobile from '@/shared/assets/images/hero-mobile.webp'
import { button } from '@/shared/ui/button'

export function HeroSection() {
  return (
    // The logo links to /#inicio. A margin taller than everything above the hero makes
    // that jump clamp to the very top, so the river bar is never left under the header.
    // The hero fills the rest of the first screen: 100svh minus the header and the
    // river bar above it (117px on phones, 109px from lg, where the bar is one line).
    // If the bar wraps, the hero runs slightly past the fold instead of leaving a gap.
    <section
      id="inicio"
      className="relative isolate flex min-h-[max(560px,calc(100svh-117px))] scroll-mt-[100vh] items-end overflow-hidden bg-navy-950 lg:min-h-[max(560px,calc(100svh-109px))]"
    >
      {/* Phones show a 560px-tall slice of the photo: they get that crop, a third of the
          weight. The build preloads the same files (scripts/production/prepare-public.mjs). */}
      <picture>
        <source
          media="(max-width: 639px)"
          srcSet={heroMobile}
          width="922"
          height="809"
        />
        <img
          src={hero1920}
          srcSet={`${hero960} 960w, ${hero1920} 1920w`}
          sizes="max(100vw, 1330px)"
          width="1920"
          height="809"
          fetchPriority="high"
          alt="Muelle y sede del club sobre el río al atardecer"
          className="hero-photo absolute inset-0 -z-20 size-full object-cover object-center sm:object-[35%_center] lg:object-center"
        />
      </picture>
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-t from-navy-950/70 via-navy-950/25 via-50% to-transparent lg:bg-gradient-to-r lg:from-navy-950/50 lg:via-navy-950/15 lg:via-35% lg:to-55%"
      />
      {/* hero-* classes: the opening sequence, see index.css. */}
      <div className="mx-auto w-full max-w-7xl px-4 py-12 text-white sm:px-6 lg:py-16">
        <h1 className="hero-in [text-shadow:0_2px_14px_rgb(3_16_36/0.7)] font-display text-5xl leading-none tracking-wide uppercase sm:text-7xl">
          Club de Pescadores
          <span className="hero-in mt-1 block font-script text-5xl tracking-normal text-sun-400 normal-case sm:text-7xl">
            San Nicolás
          </span>
        </h1>
        <p className="hero-in mt-4 max-w-md text-lg text-white [text-shadow:0_1px_8px_rgb(3_16_36/0.85)]">
          Pesca, naturaleza y amigos sobre el río.
        </p>
        <div className="hero-in mt-6 flex flex-wrap gap-3">
          <a href="#sumate" className={button.primary}>
            Hacete socio
          </a>
          <a href="#eventos" className={button.outlineOnDark}>
            Ver próximos eventos
          </a>
        </div>
      </div>
    </section>
  )
}
