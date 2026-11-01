import hero960 from '../../../assets/images/hero-960.webp'
import hero1920 from '../../../assets/images/hero-1920.webp'
import { button } from '../../../shared/ui/button'

export function HeroSection() {
  return (
    <section
      id="inicio"
      className="relative isolate flex min-h-[560px] items-end overflow-hidden bg-navy-950 lg:h-[min(42vw,calc(100vh-5rem))]"
    >
      <img
        src={hero1920}
        srcSet={`${hero960} 960w, ${hero1920} 1920w`}
        sizes="max(100vw, 1330px)"
        width="1920"
        height="809"
        fetchPriority="high"
        alt="Muelle y sede del club sobre el río al atardecer"
        className="absolute inset-0 -z-20 size-full object-cover object-[35%_center] lg:object-center"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-t from-navy-950/70 via-navy-950/25 via-50% to-transparent lg:bg-gradient-to-r lg:from-navy-950/50 lg:via-navy-950/15 lg:via-35% lg:to-55%"
      />
      <div className="mx-auto w-full max-w-7xl px-4 py-12 text-white sm:px-6 lg:py-16">
        <h1 className="[text-shadow:0_2px_14px_rgb(3_16_36/0.7)] font-display text-5xl leading-none tracking-wide uppercase sm:text-7xl">
          Club de Pescadores
          <span className="mt-1 block font-script text-5xl tracking-normal text-sun-400 normal-case sm:text-7xl">
            San Nicolás
          </span>
        </h1>
        <p className="mt-4 max-w-md text-lg text-white [text-shadow:0_1px_8px_rgb(3_16_36/0.85)]">
          Pesca, naturaleza y amigos sobre el río.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
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
