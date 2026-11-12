import { MapPin, MessageCircle } from 'lucide-react'
import logo192 from '@/shared/assets/images/logo-192.webp'
import { club } from '@/shared/config/club'
import { container } from '@/shared/ui/layout'
import { navLinks } from '../config/navigation'

const link =
  'inline-flex min-h-11 items-center gap-2 rounded transition-colors hover:text-sun-400 sm:min-h-9'

export function Footer() {
  return (
    <footer id="contacto" className="bg-navy-950 text-white">
      <div
        className={`${container} grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1.4fr] lg:py-16`}
      >
        <div>
          {/* The crest has a white background, so it sits on a white disc. */}
          <span className="grid size-20 place-items-center rounded-full bg-white">
            <img
              src={logo192}
              width="192"
              height="192"
              loading="lazy"
              alt=""
              className="size-16"
            />
          </span>
          <p className="mt-5 max-w-xs font-display text-2xl tracking-wide uppercase">
            {club.name}
          </p>
        </div>
        <nav aria-label="Pie de página">
          <h2 className="text-xs font-extrabold tracking-[0.18em] text-sun-400 uppercase">
            Secciones
          </h2>
          <ul className="mt-4 grid text-white/80">
            {navLinks.map((item) => (
              <li key={item.href}>
                <a href={item.href} className={link}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h2 className="text-xs font-extrabold tracking-[0.18em] text-sun-400 uppercase">
            Contacto
          </h2>
          <ul className="mt-4 grid gap-1 text-white/80">
            <li className="flex min-h-11 items-center gap-2 sm:min-h-9">
              <MapPin aria-hidden="true" className="size-4 shrink-0" />
              {club.location}
            </li>
            <li>
              <a href={club.whatsappUrl} className={link}>
                <MessageCircle aria-hidden="true" className="size-4 shrink-0" />
                WhatsApp {club.phone}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-sm text-white/60">
        {/* El margen derecho evita que el botón flotante de WhatsApp tape el texto. */}
        <div
          className={`${container} flex flex-wrap justify-between gap-2 pr-20 sm:pr-20 min-[1440px]:pr-6`}
        >
          <p>
            © {new Date().getFullYear()} {club.name}
          </p>
        </div>
      </div>
    </footer>
  )
}
