import { QueryBoundary } from '@/shared/ui/QueryBoundary'
import { button } from '@/shared/ui/button'
import { useEventsPage } from '../hooks/useEventsPage'
import { EventsList } from './EventsList'

export function EventsArchive() {
  const { query, hasPrevious, previous, next } = useEventsPage()
  return (
    <div>
      <QueryBoundary
        query={{ ...query, data: query.data?.items }}
        emptyMessage="No hay más eventos programados."
      >
        {(items) => <EventsList items={items} />}
      </QueryBoundary>
      <nav aria-label="Paginación de eventos" className="mt-8 flex gap-4">
        <button
          type="button"
          disabled={!hasPrevious || query.isFetching}
          onClick={previous}
          className={`${button.primary} disabled:cursor-default disabled:opacity-40`}
        >
          Anterior
        </button>
        <button
          type="button"
          disabled={
            !query.data?.nextCursor ||
            query.isFetching ||
            query.isPlaceholderData
          }
          onClick={next}
          className={`${button.primary} disabled:cursor-default disabled:opacity-40`}
        >
          Siguiente
        </button>
      </nav>
      {query.isFetching && (
        <p role="status" className="mt-4">
          Actualizando eventos…
        </p>
      )}
    </div>
  )
}
