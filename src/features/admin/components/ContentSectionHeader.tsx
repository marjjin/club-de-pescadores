import { Link } from 'react-router'
import { ArrowUpRight, Plus } from 'lucide-react'
import { contentConfig } from '../content-fields'
import { contentListCopy } from '../content-list'
import type { ContentKind } from '../schemas/admin'
import { primaryClass } from './ui'

export function ContentSectionHeader({
  kind,
  onCreate,
}: {
  kind: ContentKind
  onCreate: () => void
}) {
  const config = contentConfig[kind]
  const copy = contentListCopy[kind]
  return (
    <div className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        <p className="mb-2 text-[11px] font-extrabold tracking-[0.18em] text-ink-600 uppercase">
          Contenido del club
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">
          {config.title}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-ink-600">
          {copy.description}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        {copy.publicPath && (
          <Link
            to={copy.publicPath}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 px-2 text-sm font-semibold text-ink-600 transition-colors hover:text-navy-900"
            aria-label={`Ver ${copy.noun} en el sitio (abre otra pestaña)`}
          >
            Ver en el sitio
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        )}
        <button
          type="button"
          className={`${primaryClass} shadow-sm`}
          onClick={onCreate}
        >
          <Plus size={18} aria-hidden="true" />
          Crear {config.singular}
        </button>
      </div>
    </div>
  )
}
