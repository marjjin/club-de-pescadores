import { useState } from 'react'
import { useNavigate } from 'react-router'
import { AlertCircle, CalendarRange, Plus, Tags, Trophy } from 'lucide-react'
import { useAccess } from '../../hooks/useAccess'
import { useTournamentList } from '../../hooks/useAdminTournaments'
import { CatalogListSkeleton } from '../CatalogListSkeleton'
import { Feedback, SectionHeading, primaryClass, secondaryClass } from '../ui'
import { AnnualTablesManager } from './AnnualTablesManager'
import { CategoriesManager } from './CategoriesManager'
import { TournamentForm } from './TournamentForm'
import { TournamentListItem } from './TournamentListItem'

export function TournamentsSection({ userId }: { userId: string }) {
  const { can } = useAccess()
  const manage = can('torneos.gestionar')
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [categories, setCategories] = useState(false)
  const [annual, setAnnual] = useState(false)
  const query = useTournamentList(userId)
  const tournaments = query.data?.pages.flat() ?? []
  const failed = query.isError && !tournaments.length
  return (
    <>
      <SectionHeading
        title="Torneos"
        description="Creá torneos, registrá participantes y sumales puntos. La tabla de posiciones se publica en el sitio."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={secondaryClass}
              onClick={() => setAnnual(true)}
            >
              <CalendarRange size={17} aria-hidden="true" />
              Tablas anuales
            </button>
            <button
              type="button"
              className={secondaryClass}
              onClick={() => setCategories(true)}
            >
              <Tags size={17} aria-hidden="true" />
              Categorías
            </button>
            {manage && !creating && (
              <button
                type="button"
                className={primaryClass}
                onClick={() => setCreating(true)}
              >
                <Plus size={17} aria-hidden="true" />
                Nuevo torneo
              </button>
            )}
          </div>
        }
      />
      {annual && (
        <AnnualTablesManager userId={userId} onClose={() => setAnnual(false)} />
      )}
      {categories && (
        <CategoriesManager
          userId={userId}
          onClose={() => setCategories(false)}
        />
      )}
      {creating && (
        <div className="mb-6">
          <TournamentForm
            userId={userId}
            onCancel={() => setCreating(false)}
            onSaved={(id) => {
              void navigate(`/admin/torneos/${id}`)
            }}
          />
        </div>
      )}
      <section
        aria-label="Listado de torneos"
        aria-busy={query.isFetching}
        className="overflow-hidden rounded-2xl border border-navy-900/10 bg-white shadow-sm"
      >
        {query.error && tournaments.length > 0 && (
          <div className="p-4 sm:px-5">
            <Feedback error={query.error} />
          </div>
        )}
        {query.isPending ? (
          <CatalogListSkeleton label="Cargando torneos" />
        ) : failed ? (
          <div className="grid min-h-64 justify-items-center gap-4 px-6 py-10 text-center">
            <AlertCircle
              size={32}
              aria-hidden="true"
              className="text-ink-600"
            />
            <h2 className="text-lg font-extrabold">
              No pudimos cargar los torneos
            </h2>
            <Feedback error={query.error} />
            <button
              type="button"
              className={secondaryClass}
              onClick={() => {
                void query.refetch()
              }}
            >
              Reintentar
            </button>
          </div>
        ) : !tournaments.length ? (
          <div className="grid min-h-64 justify-items-center gap-3 px-6 py-10 text-center">
            <span
              aria-hidden="true"
              className="grid size-14 place-items-center rounded-full bg-sun-400/20 text-navy-900"
            >
              <Trophy size={26} />
            </span>
            <h2 className="text-lg font-extrabold">Todavía no hay torneos</h2>
            <p className="max-w-md text-sm leading-6 text-ink-600">
              Creá el primero, registrá a los participantes y publicá la tabla
              de posiciones en el sitio.
            </p>
            {manage && !creating && (
              <button
                type="button"
                className={`${primaryClass} mt-2`}
                onClick={() => setCreating(true)}
              >
                <Plus size={17} aria-hidden="true" />
                Crear el primer torneo
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-navy-900/10">
            {tournaments.map((tournament) => (
              <TournamentListItem key={tournament.id} tournament={tournament} />
            ))}
          </ul>
        )}
        {query.hasNextPage && (
          <div className="border-t border-navy-900/10 p-4 sm:px-5">
            <button
              type="button"
              className={secondaryClass}
              disabled={query.isFetchingNextPage}
              onClick={() => {
                void query.fetchNextPage()
              }}
            >
              {query.isFetchingNextPage ? 'Cargando…' : 'Ver más torneos'}
            </button>
          </div>
        )}
      </section>
    </>
  )
}
