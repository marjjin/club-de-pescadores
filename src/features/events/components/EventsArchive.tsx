import { PagerNav } from '@/shared/ui/PagerNav'
import { QueryBoundary } from '@/shared/ui/QueryBoundary'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useEventsPage } from '../hooks/useEventsPage'
import { EventsList, eventsGrid } from './EventsList'

export function EventsArchive() {
  const { query, hasPrevious, previous, next } = useEventsPage()
  return (
    <div>
      <QueryBoundary
        query={{ ...query, data: query.data?.items }}
        emptyMessage="No hay más eventos programados."
        loading={<Skeleton variant="row" items={6} className={eventsGrid} />}
      >
        {(items) => <EventsList items={items} />}
      </QueryBoundary>
      <PagerNav
        label="Paginación de eventos"
        canPrevious={hasPrevious && !query.isFetching}
        canNext={
          !!query.data?.nextCursor &&
          !query.isFetching &&
          !query.isPlaceholderData
        }
        onPrevious={previous}
        onNext={next}
        busyMessage={query.isFetching ? 'Actualizando eventos…' : undefined}
      />
    </div>
  )
}
