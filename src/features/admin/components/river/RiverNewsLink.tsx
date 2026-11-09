import { ArrowUpRight, Camera } from 'lucide-react'
import { Link } from 'react-router'

export function RiverNewsLink({
  dirty,
  pending,
}: {
  dirty: boolean
  pending: boolean
}) {
  return (
    <div className="mb-6 flex min-w-0 flex-col gap-3 rounded-xl border border-navy-900/10 bg-mist-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-start gap-2.5 text-xs leading-5 text-ink-600">
        <Camera
          size={18}
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-river-600"
        />
        <span>
          Las fotos y las condiciones del muelle se publican en Noticias.
        </span>
      </p>
      <Link
        to="/admin/noticias/nueva"
        aria-disabled={pending}
        onClick={(event) => {
          if (
            pending ||
            (dirty &&
              !window.confirm(
                '¿Ir a Noticias y descartar los cambios de esta medición?',
              ))
          )
            event.preventDefault()
        }}
        className="inline-flex min-h-9 shrink-0 items-center gap-1.5 text-xs font-bold text-river-600 hover:underline aria-disabled:opacity-50"
      >
        Crear noticia del muelle
        <ArrowUpRight size={15} aria-hidden="true" />
      </Link>
    </div>
  )
}
