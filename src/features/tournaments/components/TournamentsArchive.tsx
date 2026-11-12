import { ArrowRight, MapPin, Trophy } from 'lucide-react'
import { Link } from 'react-router'
import { PagerNav } from '@/shared/ui/PagerNav'
import { QueryBoundary } from '@/shared/ui/QueryBoundary'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useTournamentsPage } from '../hooks/useTournaments'
import { TournamentDates, TournamentStatus } from './TournamentDates'

const grid =
  'grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-4 sm:gap-6'

export function TournamentsArchive() {
  const { query, hasPrevious, canNext, previous, next } = useTournamentsPage()
  return (
    <div>
      <QueryBoundary
        query={{ ...query, data: query.data?.items }}
        emptyMessage="Todavía no hay torneos publicados."
        loading={<Skeleton variant="row" items={4} className={grid} />}
      >
        {(items) => (
          <ul className={grid}>
            {items.map((tournament) => (
              <li key={tournament.id} className="min-w-0">
                <Link
                  to={`/torneos/${tournament.id}`}
                  className="group flex h-full min-w-0 items-start gap-4 rounded-2xl border border-navy-900/5 bg-white p-4 shadow-card hover:border-river-600/30 sm:p-5"
                >
                  <span
                    aria-hidden="true"
                    className="grid size-12 shrink-0 place-items-center rounded-xl bg-navy-900 text-sun-400"
                  >
                    <Trophy size={22} />
                  </span>
                  <span className="min-w-0 flex-1 wrap-anywhere">
                    <TournamentStatus finished={tournament.finished} />
                    <span className="mt-2 block text-lg leading-snug font-bold group-hover:text-river-600">
                      {tournament.name}
                    </span>
                    <span className="mt-1 block text-sm text-ink-600">
                      <TournamentDates tournament={tournament} />
                    </span>
                    {tournament.place && (
                      <span className="mt-1 flex items-start gap-1.5 text-sm text-ink-600">
                        <MapPin
                          aria-hidden="true"
                          className="mt-0.5 size-4 shrink-0"
                        />
                        {tournament.place}
                      </span>
                    )}
                  </span>
                  <ArrowRight
                    aria-hidden="true"
                    className="mt-1 size-5 shrink-0 text-ink-600"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </QueryBoundary>
      <PagerNav
        label="Paginación de torneos"
        canPrevious={hasPrevious && !query.isFetching}
        canNext={canNext}
        onPrevious={previous}
        onNext={next}
        busyMessage={query.isFetching ? 'Actualizando torneos…' : undefined}
      />
    </div>
  )
}
