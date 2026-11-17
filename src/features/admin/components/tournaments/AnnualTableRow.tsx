import { useState } from 'react'
import {
  Archive,
  Check,
  ExternalLink,
  Pencil,
  RotateCcw,
  TriangleAlert,
  X,
} from 'lucide-react'
import { annualTableInputSchema } from '../../schemas/tournaments'
import type { AnnualTable, AnnualTableInput } from '../../schemas/tournaments'
import { inputClass } from '../ui'
import { CategoryToggles } from './CategoryToggles'

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
}: {
  userId: string
  table: AnnualTable
  manage: boolean
  busy: boolean
  /** Resolves once saved, so the fields close only on success. */
  onSave: (input: AnnualTableInput) => Promise<unknown>
  onToggleArchive: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(table.name)
  const [year, setYear] = useState(String(table.year))
  const [categories, setCategories] = useState(
    table.categories.map((category) => category.id),
  )
  const [error, setError] = useState<string | null>(null)
  function submit() {
    if (busy) return
    const parsed = annualTableInputSchema.safeParse({
      name,
      year: Number(year),
      categories,
    })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisá los datos.')
      return
    }
    onSave(parsed.data).then(
      () => setEditing(false),
      () => undefined,
    )
  }
  if (editing)
    return (
      <li className="px-5 py-3 sm:px-6">
        <form
          className="flex flex-wrap gap-1"
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
        >
          <div className="min-w-40 flex-1">
            <input
              value={name}
              maxLength={120}
              aria-label={`Nuevo nombre para ${table.name}`}
              onChange={(event) => {
                setName(event.target.value)
                setError(null)
              }}
              onKeyDown={(event) => {
                // Esc cancels the edit without closing the window around it.
                if (event.key === 'Escape') {
                  event.preventDefault()
                  setEditing(false)
                }
              }}
              className={inputClass}
            />
          </div>
          <div className="w-24">
            <input
              value={year}
              type="number"
              inputMode="numeric"
              min={2000}
              max={2100}
              aria-label={`Año de ${table.name}`}
              onChange={(event) => {
                setYear(event.target.value)
                setError(null)
              }}
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            aria-label="Guardar tabla anual"
            className={iconButton}
            disabled={busy}
          >
            <Check size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Cancelar"
            className={iconButton}
            onClick={() => setEditing(false)}
          >
            <X size={18} aria-hidden="true" />
          </button>
          <div className="mt-2 basis-full">
            <CategoryToggles
              userId={userId}
              label={`Categorías que suman a ${table.name}`}
              selected={categories}
              onChange={setCategories}
            />
          </div>
          {error && (
            <p role="alert" className="basis-full text-sm text-red-700">
              {error}
            </p>
          )}
        </form>
      </li>
    )
  return (
    <li
      className={`flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3 sm:px-6 ${table.archived_at ? 'opacity-60' : ''}`}
    >
      <div className="min-w-0 flex-1">
        <p>
          <span className="font-bold wrap-anywhere">{table.name}</span>
          <span className="ml-2 rounded-full bg-mist-50 px-2 py-0.5 text-xs font-bold tabular-nums">
            {table.year}
          </span>
        </p>
        <p className="mt-0.5 text-xs text-ink-600">
          {table.archived_at
            ? 'Archivada: no se ve en el sitio'
            : `${plural(table.tournaments, 'torneo vinculado', 'torneos vinculados')} · ${plural(table.finished, 'finalizado', 'finalizados')}`}
        </p>
        <p className="mt-0.5 text-xs text-ink-600">
          {table.categories.length
            ? `Suman: ${table.categories.map((category) => category.name).join(', ')}`
            : 'Suma cualquier categoría'}
        </p>
        {table.unlinked > 0 && (
          <p className="mt-1 flex items-start gap-1.5 text-xs text-amber-900">
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
      {!table.archived_at && (
        <a
          href={`/torneos/anual/${table.id}`}
          target="_blank"
          rel="noreferrer"
          aria-label={`Ver ${table.name} en el sitio`}
          className={iconButton}
        >
          <ExternalLink size={16} aria-hidden="true" />
        </a>
      )}
      {manage && (
        <>
          <button
            type="button"
            aria-label={`Editar ${table.name}`}
            className={iconButton}
            onClick={() => {
              setName(table.name)
              setYear(String(table.year))
              setCategories(table.categories.map((category) => category.id))
              setEditing(true)
            }}
          >
            <Pencil size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
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
        </>
      )}
    </li>
  )
}
