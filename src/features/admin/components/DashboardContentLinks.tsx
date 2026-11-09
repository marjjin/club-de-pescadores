import { ArrowRight, Camera, Waves } from 'lucide-react'
import { Link } from 'react-router'
import { primaryClass } from './ui'

const shortcuts = [
  {
    title: 'Fotos y estado del muelle',
    description:
      'Subí la foto y contá cómo están las condiciones para ir a pescar. Se publica como una noticia del club.',
    label: 'Publicar noticia del muelle',
    href: '/admin/noticias/nueva',
    icon: Camera,
  },
  {
    title: 'Altura del río',
    description:
      'Actualizá la altura en metros, la fecha y la fuente de la medición. Este dato aparece en su propia sección.',
    label: 'Actualizar altura del río',
    href: '/admin/rio',
    icon: Waves,
  },
]
export function DashboardContentLinks() {
  return (
    <div className="mb-6 grid min-w-0 gap-4 xl:grid-cols-2">
      {shortcuts.map(({ title, description, label, href, icon: Icon }) => (
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
          <Link to={href} className={`${primaryClass} mt-auto self-start`}>
            {label}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </section>
      ))}
    </div>
  )
}
