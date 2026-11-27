import { Clock3, MapPin, MessageCircle } from 'lucide-react'
import { Link } from 'react-router'
import logo192 from '@/shared/assets/images/logo-192.webp'
import { club } from '@/shared/config/club'
import { container } from '@/shared/ui/layout'
import { FacebookIcon, InstagramIcon } from '@/shared/ui/SocialIcons'
import { navLinks } from '../config/navigation'
import { ExternalLink } from '@/shared/ui/ExternalLink'

const link =
  'inline-flex min-h-11 items-center gap-2 rounded transition-colors hover:text-sun-400 sm:min-h-9'

export function Footer() {
  return (
    <footer id="contacto" className="bg-navy-950 text-white">
      <div
        className={`${container} grid gap-10 py-12 sm:grid-cols-2 sm:py-14 lg:grid-cols-[1.6fr_1fr_1.4fr] lg:py-16`}
      >
        {/* Phones put the crest beside the name, so the footer starts with the links sooner. */}
        <div className="flex items-center gap-4 sm:block">
          {/* The crest has a white background, so it sits on a white disc. */}
          <span className="grid size-16 shrink-0 place-items-center rounded-full bg-white sm:size-20">
            <img
              src={logo192}
              width="192"
              height="192"
              loading="lazy"
              alt=""
              className="size-12 sm:size-16"
            />
          </span>
          <p className="max-w-xs font-display text-xl tracking-wide uppercase sm:mt-5 sm:text-2xl">
            {club.name}
          </p>
        </div>
        <nav aria-label="Pie de página">
          <h2 className="text-xs font-extrabold tracking-[0.18em] text-sun-400 uppercase">
            Secciones
          </h2>
          <ul className="mt-4 grid grid-cols-2 gap-x-6 text-white/80 sm:grid-cols-1">
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
            <li>
              <ExternalLink href={club.mapsUrl} className={link}>
                <MapPin aria-hidden="true" className="size-4 shrink-0" />
                <address className="not-italic">{club.address}</address>
              </ExternalLink>
            </li>
            <li className="flex min-h-11 items-center gap-2 sm:min-h-9">
              <Clock3 aria-hidden="true" className="size-4 shrink-0" />
              {club.hours}
            </li>
            <li>
              <ExternalLink href={club.whatsappUrl} className={link}>
                <MessageCircle aria-hidden="true" className="size-4 shrink-0" />
                WhatsApp {club.phone}
              </ExternalLink>
            </li>
          </ul>
          <ul aria-label="Redes sociales" className="mt-4 flex gap-2">
            <li>
              <ExternalLink
                href={club.instagramUrl}
                aria-label="Instagram del club"
                className="grid size-11 place-items-center rounded-full bg-white/10 transition-colors hover:bg-sun-400 hover:text-navy-950"
              >
                <InstagramIcon className="size-5" />
              </ExternalLink>
            </li>
            <li>
              <ExternalLink
                href={club.facebookUrl}
                aria-label="Facebook del club"
                className="grid size-11 place-items-center rounded-full bg-white/10 transition-colors hover:bg-sun-400 hover:text-navy-950"
              >
                <FacebookIcon className="size-5" />
              </ExternalLink>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-sm text-white/60">
        {/* El margen derecho evita que el botón flotante de WhatsApp tape el texto. */}
        <div
          className={`${container} flex flex-wrap justify-between gap-2 pr-20 sm:pr-20 min-[1440px]:pr-6`}
        >
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p>
              © {new Date().getFullYear()} {club.name}
            </p>
            <Link
              to="/privacidad"
              className="inline-flex min-h-11 items-center underline-offset-4 hover:text-sun-400 hover:underline sm:min-h-0"
            >
              Privacidad
            </Link>
          </div>
          <p className="self-center">Desarrollado por CARCCO IT</p>
        </div>
      </div>
    </footer>
  )
}
