import type { UseQueryResult } from '@tanstack/react-query'
import type { ReactNode } from 'react'

type Props<T> = {
  query: UseQueryResult<T[]>
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
  if (query.isError) {
    return <p role="alert">No pudimos cargar esta sección. Probá más tarde.</p>
  }
  if (query.data.length === 0) {
    return <p>{emptyMessage}</p>
  }
  return children(query.data)
}
