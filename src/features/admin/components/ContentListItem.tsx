import {
  CalendarDays,
  FileText,
  MapPin,
  Pencil,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import { contentStatus } from '../content-list'
import { dateLabel } from '../form-utils'
import type { Content } from '../schemas/admin'
import { secondaryClass } from './ui'

export function ContentListItem({
  row,
  busy,
  onEdit,
  onArchive,
  onDelete,
}: {
  row: Content
  busy: boolean
  onEdit: () => void
  onArchive: () => void
  /** Offered only for archived rows of content that supports permanent deletion. */
  onDelete?: (() => void) | undefined
}) {
  const title = 'title' in row ? row.title : `${row.season} · ${row.period}`
  const status = contentStatus(row)
  return (
    <article className="group flex flex-col gap-4 px-4 py-5 transition-colors hover:bg-mist-50/60 sm:flex-row sm:items-center sm:px-6">
      <div
        aria-hidden="true"
        className="hidden size-20 shrink-0 overflow-hidden rounded-xl border border-navy-900/10 bg-mist-50 sm:grid sm:place-items-center"
      >
        {'image_url' in row ? (
          <img
            src={row.image_url}
            alt=""
            loading="lazy"
            width="80"
            height="80"
            style={{
              objectPosition: `${row.image_focus_x}% ${row.image_focus_y}%`,
            }}
            className="size-full object-cover"
          />
        ) : 'starts_at' in row ? (
          <CalendarDays size={28} className="text-navy-800/60" />
        ) : (
          <FileText size={28} className="text-navy-800/60" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-bold ${status.className}`}
          >
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-current"
            />
            {status.label}
          </span>
          <span className="text-xs text-ink-600">
            Última edición {dateLabel(row.updated_at)}
          </span>
        </div>
        <h2 className="text-base leading-6 font-extrabold break-words">
          {row.deleted_at ? (
            title
          ) : (
            <button
              type="button"
              onClick={onEdit}
              disabled={busy}
              className="text-left hover:text-river-600 hover:underline"
            >
              {title}
            </button>
          )}
        </h2>
        {'excerpt' in row && (
          <p className="mt-1 line-clamp-2 text-sm leading-5 text-ink-600">
            {row.excerpt}
          </p>
        )}
        {status.label === 'Programada' && 'published_at' in row && (
          <p className="mt-1 text-xs font-semibold text-sky-800">
            Se publicará el {dateLabel(row.published_at)}
          </p>
        )}
        {'starts_at' in row && (
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-600">
            <span>{dateLabel(row.starts_at)}</span>
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} aria-hidden="true" />
              {row.place}
            </span>
          </p>
        )}
        {'family_description' in row && (
          <p className="mt-1 line-clamp-2 text-sm text-ink-600">
            {row.family_description}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
        {!row.deleted_at && (
          <button
            type="button"
            className={secondaryClass}
            onClick={onEdit}
            disabled={busy}
            aria-label={`Editar «${title}»`}
          >
            <Pencil size={14} aria-hidden="true" />
            Editar
          </button>
        )}
        <button
          type="button"
          className={
            row.deleted_at
              ? secondaryClass
              : 'grid size-11 place-items-center rounded-lg text-ink-600 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-40'
          }
          disabled={busy}
          onClick={onArchive}
          aria-label={
            row.deleted_at
              ? `Restaurar «${title}»`
              : `Enviar «${title}» a la papelera`
          }
          title={
            row.deleted_at ? 'Restaurar como borrador' : 'Enviar a la papelera'
          }
        >
          {row.deleted_at ? (
            <>
              <RotateCcw size={15} aria-hidden="true" />
              Restaurar
            </>
          ) : (
            <Trash2 size={17} aria-hidden="true" />
          )}
        </button>
        {row.deleted_at && onDelete && (
          <button
            type="button"
            disabled={busy}
            onClick={onDelete}
            aria-label={`Eliminar definitivamente «${title}»`}
            title="Eliminar definitivamente, con su imagen"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-red-200 px-3 text-sm font-bold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-40"
          >
            <Trash2 size={15} aria-hidden="true" />
            Eliminar
          </button>
        )}
      </div>
    </article>
  )
}
