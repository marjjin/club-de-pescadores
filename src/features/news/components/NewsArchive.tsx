import { QueryBoundary } from '@/shared/ui/QueryBoundary'
import { button } from '@/shared/ui/button'
import { useNewsPage } from '../hooks/useNewsPage'
import { NewsList } from './NewsList'

export function NewsArchive() {
  const { query, hasPrevious, previous, next } = useNewsPage()
  return (
    <div>
      <QueryBoundary
        query={{ ...query, data: query.data?.items }}
        emptyMessage="No hay más noticias publicadas."
      >
        {(items) => <NewsList items={items} />}
      </QueryBoundary>
      <nav aria-label="Paginación de noticias" className="mt-8 flex gap-4">
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
          Actualizando noticias…
        </p>
      )}
    </div>
  )
}
