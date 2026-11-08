import { Link } from 'react-router'
import { button } from '@/shared/ui/button'

export function NotFoundPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 text-center">
      <title>Página no encontrada | Club de Pescadores San Nicolás</title>
      <meta name="robots" content="noindex" />
      <h1 className="text-4xl font-extrabold">No encontramos esta página</h1>
      <p className="mt-4 text-ink-600">El enlace puede haber cambiado.</p>
      <Link to="/" className={`${button.primary} mt-8`}>
        Volver al inicio
      </Link>
    </section>
  )
}
