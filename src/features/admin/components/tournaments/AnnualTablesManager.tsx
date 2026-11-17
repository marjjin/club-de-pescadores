import { useState } from 'react'
import { CalendarRange, Plus, X } from 'lucide-react'
import { useAccess } from '../../hooks/useAccess'
import { useConfirm } from '../../hooks/useConfirm'
import {
  useAnnualTableActions,
  useAnnualTables,
} from '../../hooks/useAnnualTables'
import { annualTableInputSchema } from '../../schemas/tournaments'
import type { AnnualTable } from '../../schemas/tournaments'
import { Feedback, Loading, inputClass, primaryClass } from '../ui'
import { AnnualTableRow } from './AnnualTableRow'
import { CategoryToggles } from './CategoryToggles'
import { TournamentDialog } from './TournamentDialog'

const thisYear = () => new Date().getFullYear()

export function AnnualTablesManager({
  userId,
  onClose,
}: {
  userId: string
  onClose: () => void
}) {
  const manage = useAccess().can('torneos.gestionar')
  const confirm = useConfirm()
  const query = useAnnualTables(userId)
  const { save, archive } = useAnnualTableActions(userId)
  const [name, setName] = useState('')
  const [year, setYear] = useState(String(thisYear()))
  const [categories, setCategories] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const busy = save.isPending || archive.isPending
  function create() {
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
    save.mutate(
      { input: parsed.data },
      {
        onSuccess: () => {
          setName('')
          setCategories([])
        },
      },
    )
  }
  async function toggleArchive(table: AnnualTable) {
    const archived = !table.archived_at
    if (
      archived &&
      !(await confirm({
        title: `¿Archivar «${table.name}»?`,
        message:
          'Deja de verse en el sitio y no se le pueden vincular torneos nuevos. Los torneos y sus puntos no cambian; podés restaurarla cuando quieras.',
        confirmLabel: 'Archivar',
      }))
    )
      return
    archive.mutate({ id: table.id, archived })
  }
  return (
    <TournamentDialog
      labelledBy="annual-title"
      describedBy="annual-description"
      onClose={onClose}
    >
      <div className="sticky top-0 z-10 flex items-start gap-3 border-b border-navy-900/10 bg-mist-50 px-5 py-4 sm:px-6">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-sun-400/25 text-navy-900"
        >
          <CalendarRange size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="annual-title" className="text-base font-extrabold">
            Tablas anuales
          </h2>
          <p id="annual-description" className="mt-0.5 text-sm text-ink-600">
            Suman los puntos de cada persona en los torneos finalizados que
            vincules, con posiciones por categoría. Elegí qué categorías suman y
            los torneos se vinculan solos al elegir esas categorías.
          </p>
        </div>
        <button
          type="button"
          autoFocus
          aria-label="Cerrar tablas anuales"
          className="grid size-11 shrink-0 place-items-center rounded-lg text-ink-600 hover:bg-mist-50 hover:text-navy-900"
          onClick={onClose}
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      {manage && (
        <form
          className="flex flex-wrap gap-2 border-b border-navy-900/10 p-4 sm:px-6"
          onSubmit={(event) => {
            event.preventDefault()
            create()
          }}
        >
          <div className="min-w-48 flex-1">
            <input
              value={name}
              maxLength={120}
              aria-label="Nombre de la nueva tabla anual"
              placeholder="Por ejemplo, Campeonato anual"
              onChange={(event) => {
                setName(event.target.value)
                setError(null)
                save.reset()
              }}
              className={inputClass}
            />
          </div>
          <div className="w-28">
            <input
              value={year}
              type="number"
              inputMode="numeric"
              min={2000}
              max={2100}
              aria-label="Año de la tabla anual"
              onChange={(event) => {
                setYear(event.target.value)
                setError(null)
                save.reset()
              }}
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            className={primaryClass}
            disabled={!name.trim() || busy}
          >
            <Plus size={16} aria-hidden="true" />
            Crear tabla
          </button>
          <div className="basis-full">
            <CategoryToggles
              userId={userId}
              label="Categorías que suman a la nueva tabla"
              selected={categories}
              onChange={(ids) => {
                setCategories(ids)
                save.reset()
              }}
            />
          </div>
          {error && (
            <p role="alert" className="basis-full text-sm text-red-700">
              {error}
            </p>
          )}
        </form>
      )}
      <div className="px-5 pt-3 empty:hidden sm:px-6">
        <Feedback error={save.error ?? archive.error ?? query.error} />
      </div>
      {query.isPending ? (
        <Loading />
      ) : !query.data?.length ? (
        <p className="px-5 py-6 text-sm text-ink-600 sm:px-6">
          Todavía no hay tablas anuales. Creá una y después vinculale los
          torneos desde «Editar datos».
        </p>
      ) : (
        <ul className="divide-y divide-navy-900/10">
          {query.data.map((table) => (
            <AnnualTableRow
              userId={userId}
              // Remount after an edit so the fields start from the saved values.
              key={`${table.id}:${table.updated_at}`}
              table={table}
              manage={manage}
              busy={busy}
              onSave={(input) => save.mutateAsync({ input, current: table })}
              onToggleArchive={() => {
                void toggleArchive(table)
              }}
            />
          ))}
        </ul>
      )}
    </TournamentDialog>
  )
}
