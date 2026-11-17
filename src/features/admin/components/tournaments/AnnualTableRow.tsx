import { useState } from 'react'
import {
  Archive,
  ExternalLink,
  Pencil,
  RotateCcw,
  Trash2,
  TriangleAlert,
} from 'lucide-react'
import type { AnnualTable, AnnualTableInput } from '../../schemas/tournaments'
import { AnnualTableForm } from './AnnualTableForm'

const iconButton =
  'grid size-11 shrink-0 place-items-center rounded-lg text-ink-600 hover:bg-mist-50 hover:text-navy-900 disabled:opacity-50'
const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`

export function AnnualTableRow({
  userId,
  table,
  manage,
  busy,
  onSave,
  onToggleArchive,
  onDelete,
}: {
  userId: string
  table: AnnualTable
  manage: boolean
  busy: boolean
  /** Resolves once saved, so the form closes only on success. */
  onSave: (input: AnnualTableInput) => Promise<unknown>
  onToggleArchive: () => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  if (editing)
    return (
      <li className="rounded-xl border border-river-600/40 bg-mist-50/60 p-4 ring-2 ring-river-600/10">
        <AnnualTableForm
          userId={userId}
          label={`Editar ${table.name}`}
          categoriesLabel={`Categorías que suman a ${table.name}`}
          initial={{
            name: table.name,
            year: table.year,
            categories: table.categories.map((category) => category.id),
          }}
          submitLabel="Guardar cambios"
          pending={busy}
          onSubmit={(input) => {
            onSave(input).then(
              () => setEditing(false),
              () => undefined,
            )
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    )
  return (
    <li className="flex min-w-0 items-start gap-2 rounded-xl border border-navy-900/10 bg-white p-4">
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-bold wrap-anywhere">{table.name}</span>
          <span className="rounded-full bg-mist-50 px-2 py-0.5 text-xs font-bold tabular-nums">
            {table.year}
          </span>
        </p>
        <p className="mt-1 text-xs text-ink-600">
          {table.archived_at
            ? 'Archivada: no se ve en el sitio'
            : `${plural(table.tournaments, 'torneo vinculado', 'torneos vinculados')} · ${plural(table.finished, 'finalizado', 'finalizados')}`}
        </p>
        <ul
          aria-label={`Categorías de ${table.name}`}
          className="mt-2 flex flex-wrap gap-1.5"
        >
          {table.categories.length ? (
            table.categories.map((category) => (
              <li
                key={category.id}
                className="rounded-full bg-navy-900 px-2.5 py-0.5 text-xs font-bold text-white"
              >
                {category.name}
              </li>
            ))
          ) : (
            <li className="rounded-full border border-dashed border-navy-900/20 px-2.5 py-0.5 text-xs text-ink-600">
              Cualquier categoría
            </li>
          )}
        </ul>
        {table.unlinked > 0 && (
          <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-900">
            <TriangleAlert
              size={14}
              aria-hidden="true"
              className="mt-px shrink-0"
            />
            {plural(
              table.unlinked,
              'inscripción sin ficha no suma',
              'inscripciones sin ficha no suman',
            )}
            : vinculalas a una persona desde el torneo.
          </p>
        )}
      </div>
      <div className="flex shrink-0">
        {!table.archived_at && (
          <a
            href={`/torneos/anual/${table.id}`}
            target="_blank"
            rel="noreferrer"
            title="Ver en el sitio"
            aria-label={`Ver ${table.name} en el sitio`}
            className={iconButton}
          >
            <ExternalLink size={16} aria-hidden="true" />
          </a>
        )}
        {manage && (
          <>
            {!table.archived_at && (
              <button
                type="button"
                title="Editar"
                aria-label={`Editar ${table.name}`}
                className={iconButton}
                onClick={() => setEditing(true)}
              >
                <Pencil size={16} aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              title={table.archived_at ? 'Restaurar' : 'Archivar'}
              aria-label={
                table.archived_at
                  ? `Restaurar ${table.name}`
                  : `Archivar ${table.name}`
              }
              className={iconButton}
              disabled={busy}
              onClick={onToggleArchive}
            >
              {table.archived_at ? (
                <RotateCcw size={16} aria-hidden="true" />
              ) : (
                <Archive size={16} aria-hidden="true" />
              )}
            </button>
            {table.archived_at && (
              <button
                type="button"
                title="Eliminar definitivamente"
                aria-label={`Eliminar ${table.name} definitivamente`}
                className={`${iconButton} hover:bg-red-50 hover:text-red-700`}
                disabled={busy}
                onClick={onDelete}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            )}
          </>
        )}
      </div>
    </li>
  )
}
