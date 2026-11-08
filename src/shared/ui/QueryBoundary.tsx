import type { ReactNode } from 'react'

type Props<T> = {
  query: {
    isPending: boolean
    isError: boolean
    data: T[] | undefined
    refetch: () => Promise<unknown>
  }
  emptyMessage: string
  children: (items: T[]) => ReactNode
}

export function QueryBoundary<T>({ query, emptyMessage, children }: Props<T>) {
  if (query.isPending) {
    return (
      <div
        role="status"
        aria-label="Cargando"
        className="h-48 animate-pulse rounded-xl bg-navy-900/10"
      />
    )
  }
  if (query.data === undefined) {
    return (
      <div role="alert">
        <p>No pudimos cargar esta sección. Probá de nuevo.</p>
        <button
          type="button"
          onClick={() => {
            void query.refetch()
          }}
          className="mt-2 min-h-11 font-bold text-river-600 hover:underline"
        >
          Reintentar
        </button>
      </div>
    )
  }
  if (query.data.length === 0) {
    return <p>{emptyMessage}</p>
  }
  return (
    <>
      {query.isError && (
        <p role="status" className="mb-4">
          No pudimos actualizar esta sección. Mostramos la última información
          disponible.
        </p>
      )}
      {children(query.data)}
    </>
  )
}
