import { PagerNav } from '@/shared/ui/PagerNav'
import { QueryBoundary } from '@/shared/ui/QueryBoundary'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useNewsPage } from '../hooks/useNewsPage'
import { NewsList } from './NewsList'

export function NewsArchive() {
  const { query, hasPrevious, previous, next } = useNewsPage()
  return (
    <div>
      <QueryBoundary
        query={{ ...query, data: query.data?.items }}
        emptyMessage="No hay más noticias publicadas."
        loading={
          <Skeleton
            variant="card"
            items={6}
            className="md:grid-cols-2 lg:grid-cols-3"
          />
        }
      >
        {(items) => <NewsList items={items} />}
      </QueryBoundary>
      <PagerNav
        label="Paginación de noticias"
        canPrevious={hasPrevious && !query.isFetching}
        canNext={
          !!query.data?.nextCursor &&
          !query.isFetching &&
          !query.isPlaceholderData
        }
        onPrevious={previous}
        onNext={next}
        busyMessage={query.isFetching ? 'Actualizando noticias…' : undefined}
      />
    </div>
  )
}
