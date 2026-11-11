import { ArrowRight, Camera, Newspaper } from 'lucide-react'
import { Link } from 'react-router'
import { primaryClass, secondaryClass } from './ui'

const shortcuts = [
  {
    title: 'Parte del muelle',
    description:
      'Altura del río, cómo está el muelle y fotos o videos del día, en un solo formulario. Se publica en el inicio del sitio.',
    label: 'Cargar parte del muelle',
    href: '/admin/muelle',
    icon: Camera,
    primary: true,
  },
  {
    title: 'Noticias del club',
    description:
      'Novedades, visitas, capturas destacadas y anuncios con su foto de portada.',
    label: 'Escribir una noticia',
    href: '/admin/noticias/nueva',
    icon: Newspaper,
    primary: false,
  },
]
export function DashboardContentLinks() {
  return (
    <div className="mb-6 grid min-w-0 gap-4 xl:grid-cols-2">
      {shortcuts.map(
        ({ title, description, label, href, icon: Icon, primary }) => (
          <section
            key={href}
            aria-label={title}
            className="flex min-w-0 flex-col rounded-2xl border border-river-600/20 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="mb-5 flex min-w-0 items-start gap-4">
              <span
                aria-hidden="true"
                className="grid size-11 shrink-0 place-items-center rounded-xl bg-mist-50 text-river-600"
              >
                <Icon size={23} />
              </span>
              <div className="min-w-0">
                <h2 className="text-lg font-extrabold">{title}</h2>
                <p className="mt-1 text-sm leading-6 text-ink-600">
                  {description}
                </p>
              </div>
            </div>
            <Link
              to={href}
              className={`${primary ? primaryClass : secondaryClass} mt-auto self-start`}
            >
              {label}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </section>
        ),
      )}
    </div>
  )
}
