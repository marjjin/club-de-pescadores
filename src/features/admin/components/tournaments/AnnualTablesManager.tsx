import { useState } from 'react'
import { CalendarRange, ChevronDown, Plus } from 'lucide-react'
import { useAccess } from '../../hooks/useAccess'
import { useConfirm } from '../../hooks/useConfirm'
import {
  useAnnualTableActions,
  useAnnualTables,
} from '../../hooks/useAnnualTables'
import type { AnnualTable } from '../../schemas/tournaments'
import { Feedback, Loading } from '../ui'
import { AnnualTableForm } from './AnnualTableForm'
import { AnnualTableRow } from './AnnualTableRow'
import { TournamentDialog } from './TournamentDialog'

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
  const { save, archive, remove } = useAnnualTableActions(userId)
  const [creating, setCreating] = useState(false)
  const busy = save.isPending || archive.isPending || remove.isPending
  const tables = query.data ?? []
  const active = tables.filter((table) => !table.archived_at)
  const archived = tables.filter((table) => table.archived_at)
  // With no tables yet, the form is the only useful thing to show.
  const showForm =
    manage &&
    (creating || (!query.isPending && !query.isError && !tables.length))
  async function toggleArchive(table: AnnualTable) {
    const archiving = !table.archived_at
    if (
      archiving &&
      !(await confirm({
        title: `¿Archivar «${table.name}»?`,
        message:
          'Deja de verse en el sitio y no se le pueden vincular torneos nuevos. Los torneos y sus puntos no cambian; podés restaurarla cuando quieras.',
        confirmLabel: 'Archivar',
      }))
    )
      return
    archive.mutate({ id: table.id, archived: archiving })
  }
  async function destroy(table: AnnualTable) {
    if (
      await confirm({
        title: `¿Eliminar «${table.name}» definitivamente?`,
        message:
          'Se borra la tabla y sus vínculos con los torneos. Los torneos y sus puntos no cambian. No se puede deshacer.',
        confirmLabel: 'Eliminar',
        tone: 'danger',
      })
    )
      remove.mutate(table)
  }
  const row = (table: AnnualTable) => (
    <AnnualTableRow
      // Remount after an edit so the form starts from the saved values.
      key={`${table.id}:${table.updated_at}`}
      userId={userId}
      table={table}
      manage={manage}
      busy={busy}
      onSave={(input) => save.mutateAsync({ input, current: table })}
      onToggleArchive={() => {
        void toggleArchive(table)
      }}
      onDelete={() => {
        void destroy(table)
      }}
    />
  )
  return (
    <TournamentDialog
      title="Tablas anuales"
      description="Suman los puntos de los torneos finalizados. Elegí qué categorías suma cada tabla y los torneos se vinculan solos."
      icon={<CalendarRange size={19} />}
      iconTone="sun"
      closeLabel="Cerrar tablas anuales"
      onClose={onClose}
    >
      <div className="grid gap-4 p-5 sm:p-6">
        <Feedback
          error={save.error ?? archive.error ?? remove.error ?? query.error}
        />
        {showForm ? (
          <section
            aria-labelledby="annual-new-title"
            className="rounded-xl border border-river-600/40 bg-mist-50/60 p-4 ring-2 ring-river-600/10"
          >
            <h3 id="annual-new-title" className="mb-3 text-sm font-extrabold">
              Nueva tabla anual
            </h3>
            <AnnualTableForm
              userId={userId}
              label="Nueva tabla anual"
              categoriesLabel="Categorías que suman a la nueva tabla"
              initial={{
                name: '',
                year: new Date().getFullYear(),
                categories: [],
              }}
              submitLabel="Crear tabla"
              pending={save.isPending}
              onSubmit={(input) =>
                save.mutate({ input }, { onSuccess: () => setCreating(false) })
              }
              onCancel={() => {
                setCreating(false)
                save.reset()
              }}
            />
          </section>
        ) : (
          manage && (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-navy-900/15 text-sm font-bold text-navy-900 hover:border-river-600/50 hover:bg-mist-50"
            >
              <Plus size={17} aria-hidden="true" />
              Nueva tabla anual
            </button>
          )
        )}
        {query.isPending ? (
          <Loading />
        ) : !tables.length ? (
          !manage && (
            <p className="py-6 text-center text-sm text-ink-600">
              Todavía no hay tablas anuales.
            </p>
          )
        ) : (
          <>
            {active.length > 0 && (
              <ul aria-label="Tablas anuales activas" className="grid gap-3">
                {active.map(row)}
              </ul>
            )}
            {archived.length > 0 && (
              <details className="group rounded-xl border border-navy-900/10">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-4 text-sm font-bold text-ink-600 hover:text-navy-900">
                  Archivadas ({archived.length})
                  <ChevronDown
                    size={16}
                    aria-hidden="true"
                    className="transition-transform group-open:rotate-180"
                  />
                </summary>
                <p className="px-4 pb-2 text-xs text-ink-600">
                  No se ven en el sitio. Podés restaurarlas o eliminarlas
                  definitivamente.
                </p>
                <ul className="grid gap-3 p-3 pt-0">{archived.map(row)}</ul>
              </details>
            )}
          </>
        )}
      </div>
    </TournamentDialog>
  )
}
