import { CloudOff } from 'lucide-react'
import type { ReactNode } from 'react'
import { buttonClass } from './button'
import { StatusMessage } from './StatusMessage'

type Props<T> = {
  query: {
    isPending: boolean
    isError: boolean
    data: T[] | undefined
    refetch: () => Promise<unknown>
  }
  emptyMessage: string
  /** Placeholder shaped like the content; must expose role="status". */
  loading?: ReactNode
  children: (items: T[]) => ReactNode
}

export function QueryBoundary<T>({
  query,
  emptyMessage,
  loading,
  children,
}: Props<T>) {
  if (query.isPending) {
    return (
      loading ?? (
        <div
          role="status"
          aria-label="Cargando"
          className="h-48 rounded-2xl bg-navy-900/8 motion-safe:animate-pulse"
        />
      )
    )
  }
  if (query.data === undefined) {
    return (
      <StatusMessage
        tone="error"
        action={
          <button
            type="button"
            onClick={() => {
              void query.refetch()
            }}
            className={buttonClass('outline', 'sm')}
          >
            Reintentar
          </button>
        }
      >
        <p>No pudimos cargar esta sección. Probá de nuevo.</p>
      </StatusMessage>
    )
  }
  if (query.data.length === 0) {
    return (
      <StatusMessage tone="empty">
        <p>{emptyMessage}</p>
      </StatusMessage>
    )
  }
  return (
    <>
      {query.isError && (
        <p
          role="status"
          className="mb-4 flex items-center gap-2 text-sm text-ink-600"
        >
          <CloudOff size={16} aria-hidden="true" className="shrink-0" />
          No pudimos actualizar esta sección. Mostramos la última información
          disponible.
        </p>
      )}
      {children(query.data)}
    </>
  )
}
