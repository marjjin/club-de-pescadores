import { useState } from 'react'
import { LoaderCircle, RotateCcw } from 'lucide-react'
import { useIsMutating } from '@tanstack/react-query'
import { useAdminRiver } from '../../hooks/useAdminRiver'
import { Feedback, secondaryClass, SectionHeading } from '../ui'
import { RiverForm } from './RiverForm'

export function RiverSection({ userId }: { userId: string }) {
  const query = useAdminRiver(userId)
  const [revision, setRevision] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const saving =
    useIsMutating({ mutationKey: ['admin', userId, 'river', 'save'] }) > 0
  async function reload() {
    if (
      saving ||
      refreshing ||
      !window.confirm(
        '¿Volver a cargar la medición guardada? Se descartarán los cambios del formulario.',
      )
    )
      return
    setRefreshing(true)
    try {
      const result = await query.refetch()
      if (result.isSuccess) setRevision((value) => value + 1)
    } finally {
      setRefreshing(false)
    }
  }
  return (
    <>
      <SectionHeading
        title="Altura del río"
        description="Actualizá el valor, verificá de dónde proviene y elegí si querés mostrarlo en el sitio del club."
        action={
          <button
            type="button"
            className={secondaryClass}
            disabled={query.isFetching || refreshing || saving}
            onClick={() => {
              void reload()
            }}
          >
            {query.isFetching || refreshing ? (
              <LoaderCircle
                size={16}
                aria-hidden="true"
                className="motion-safe:animate-spin"
              />
            ) : (
              <RotateCcw size={16} aria-hidden="true" />
            )}
            {query.isFetching || refreshing
              ? 'Recargando medición…'
              : 'Recargar medición guardada'}
          </button>
        }
      />
      {query.isPending ? (
        <div
          role="status"
          className="rounded-2xl border border-navy-900/10 bg-white p-6 shadow-sm"
        >
          <p className="flex items-center gap-2 text-sm font-bold">
            <LoaderCircle
              size={17}
              aria-hidden="true"
              className="motion-safe:animate-spin"
            />
            Cargando medición guardada…
          </p>
          <div
            aria-hidden="true"
            className="mt-5 grid gap-4 motion-safe:animate-pulse"
          >
            <div className="h-14 rounded-xl bg-mist-50" />
            <div className="h-40 rounded-xl bg-mist-50" />
          </div>
        </div>
      ) : query.data === undefined ? (
        <Feedback error={query.error} />
      ) : (
        <>
          <Feedback error={query.error} />
          <RiverForm
            key={`${userId}-${revision}`}
            row={query.data}
            userId={userId}
          />
        </>
      )}
    </>
  )
}
