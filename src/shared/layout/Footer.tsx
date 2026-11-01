import { Mail, MapPin, Phone } from 'lucide-react'
import logo192 from '../../assets/images/logo-192.webp'
import { club, navLinks } from '../config/club'
import { ComingSoonLink } from '../ui/ComingSoonLink'
import { FacebookIcon, InstagramIcon, YoutubeIcon } from '../ui/SocialIcons'

const socialLinks = [
  { label: 'Facebook', Icon: FacebookIcon },
  { label: 'Instagram', Icon: InstagramIcon },
  { label: 'YouTube', Icon: YoutubeIcon },
]

export function Footer() {
  return (
    <footer id="contacto" className="border-t border-navy-900/10">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.6fr_1fr_1.4fr]">
        <div>
          <img
            src={logo192}
            width="192"
            height="192"
            loading="lazy"
            alt=""
            className="size-20"
          />
          <p className="mt-3 font-extrabold">{club.name}</p>
          <ul className="mt-3 flex gap-4">
            {socialLinks.map(({ label, Icon }) => (
              <li key={label}>
                <ComingSoonLink label={label} className="text-xs font-bold">
                  <Icon className="size-6 text-navy-900" />
                </ComingSoonLink>
              </li>
            ))}
          </ul>
        </div>
        <nav aria-label="Pie de página">
          <h2 className="font-bold">Secciones</h2>
          <ul className="mt-3 space-y-2 text-ink-600">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="hover:text-river-600">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h2 className="font-bold">Contacto</h2>
          <ul className="mt-3 space-y-2 text-ink-600">
            <li className="flex items-center gap-2">
              <MapPin aria-hidden="true" className="size-4 shrink-0" />
              {club.location}
            </li>
            <li className="flex items-center gap-2 break-all">
              <Mail aria-hidden="true" className="size-4 shrink-0" />
              <a href={`mailto:${club.email}`} className="hover:text-river-600">
                {club.email}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Phone aria-hidden="true" className="size-4 shrink-0" />
              <a href={club.whatsappUrl} className="hover:text-river-600">
                {club.phone}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-navy-900/10 py-4 text-sm text-ink-600">
        {/* El margen derecho evita que el botón flotante de WhatsApp tape el texto. */}
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-2 px-4 pr-20 sm:px-6 sm:pr-20 min-[1440px]:pr-6">
          <p>© 2026 {club.name}</p>
          <p>Boceto de propuesta: contenidos de ejemplo.</p>
        </div>
      </div>
    </footer>
  )
}
