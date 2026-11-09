import { Clock3, Eye, MapPin, Waves } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  formatRiverDate,
  formatRiverHeight,
  isRiverReadingOld,
} from '@/features/river'
import { riverHeightToCm, riverLocalDateToInstant } from '../../river-editor'
import type { RiverValues } from '../../river-editor'

export function RiverPreview({ values }: { values: RiverValues }) {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])
  const cm = riverHeightToCm(values.height)
  const instant = riverLocalDateToInstant(values.measured_at)
  const future = instant !== null && Date.parse(instant) > now
  const old = instant !== null && isRiverReadingOld(instant, now)
  return (
    <section
      aria-label="Vista previa de la medición"
      className="min-w-0 overflow-hidden rounded-2xl border border-navy-900/10 bg-white shadow-sm"
    >
      <header className="flex items-center gap-2 border-b border-navy-900/10 px-5 py-4">
        <Eye size={17} aria-hidden="true" className="text-ink-600" />
        <h2 className="text-sm font-extrabold">Vista previa</h2>
      </header>
      <div className="p-5 wrap-anywhere">
        <div className="rounded-xl bg-navy-900 p-5 text-white">
          <p className="flex items-center gap-2 text-xs font-bold text-white/80">
            <Waves size={18} aria-hidden="true" />
            Altura del río
          </p>
          <p className="mt-3 text-4xl font-extrabold tracking-tight tabular-nums sm:text-5xl">
            {cm === null ? '— m' : formatRiverHeight(cm)}
          </p>
        </div>
        <p className="mt-5 flex items-start gap-2 text-sm font-bold">
          <MapPin
            size={16}
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-river-600"
          />
          <span>{values.station.trim() || 'Punto por completar'}</span>
        </p>
        <p className="mt-2 flex items-start gap-2 text-xs leading-5 text-ink-600">
          <Clock3 size={15} aria-hidden="true" className="mt-0.5 shrink-0" />
          <span>
            {instant ? (
              <>
                <time dateTime={instant}>{formatRiverDate(instant)}</time> ·
                Hora argentina
              </>
            ) : (
              'Fecha y hora por completar'
            )}
          </span>
        </p>
        <p className="mt-3 border-t border-navy-900/10 pt-3 text-xs leading-5 text-ink-600">
          <span className="font-bold">Fuente:</span>{' '}
          {values.source.trim() || 'Por completar'}
        </p>
        {(old || future) && (
          <p className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
            <Clock3 size={15} aria-hidden="true" className="mt-0.5 shrink-0" />
            <span>
              {future
                ? 'La fecha es futura. Corregila antes de guardar.'
                : 'Medición de hace más de 24 h'}
            </span>
          </p>
        )}
      </div>
      <p className="border-t border-navy-900/10 bg-mist-50 px-5 py-3 text-xs leading-5 text-ink-600">
        {values.is_published
          ? 'Así se mostrará la información al guardar y publicar.'
          : 'Vista previa interna. Esta medición no se mostrará en el sitio al guardar.'}
      </p>
    </section>
  )
}
