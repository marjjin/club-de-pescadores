import { Link } from 'react-router'
import { button } from '@/shared/ui/button'
import { PAGES } from '@/shared/seo/pages.mjs'
import { container } from '@/shared/ui/layout'

export function NotFoundPage() {
  return (
    <section
      className={`${container} grid justify-items-center py-24 text-center lg:py-32`}
    >
      <title>{PAGES.notFound.title}</title>
      <meta name="robots" content="noindex" />
      <p
        aria-hidden="true"
        className="font-display text-8xl leading-none text-mist-100 sm:text-9xl"
      >
        404
      </p>
      <span
        aria-hidden="true"
        className="mt-6 h-1 w-10 rounded-full bg-sun-400"
      />
      <h1 className="mt-6 font-display text-4xl tracking-wide uppercase sm:text-5xl">
        No encontramos esta página
      </h1>
      <p className="mt-4 text-lg text-ink-600">
        El enlace puede haber cambiado.
      </p>
      <Link to="/" className={`${button.primary} mt-8`}>
        Volver al inicio
      </Link>
    </section>
  )
}
