import { Eye } from 'lucide-react'
import { ratePriceLabel } from '../../rate-editor'
import type { RateEditorValues } from '../../rate-editor'

export function RatePreview({ values }: { values: RateEditorValues }) {
  return (
    <section
      aria-label="Vista previa de la tarifa"
      className="min-w-0 rounded-2xl border border-navy-900/10 bg-white p-5 shadow-sm"
    >
      <h2 className="mb-4 flex items-center gap-2 text-sm font-extrabold">
        <Eye size={17} aria-hidden="true" />
        Así se verá en el sitio
      </h2>
      <article className="min-w-0 overflow-hidden rounded-xl border border-navy-900/10">
        <h3 className="bg-navy-900 px-4 py-3 text-sm font-bold wrap-anywhere text-white">
          {values.season.trim() || 'Temporada'} ·{' '}
          {values.period.trim() || 'Período'}
        </h3>
        <dl className="grid gap-5 p-4">
          <div>
            <dt className="text-xs text-ink-600">Grupo familiar</dt>
            <dd className="mt-1 text-2xl font-extrabold wrap-anywhere tabular-nums">
              {ratePriceLabel(values.family_price_cents)}
            </dd>
            <dd className="mt-2 text-xs leading-5 whitespace-pre-wrap wrap-anywhere text-ink-600">
              {values.family_description.trim() ||
                'Las condiciones del grupo aparecerán acá.'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-600">Individual</dt>
            <dd className="mt-1 text-2xl font-extrabold wrap-anywhere tabular-nums">
              {ratePriceLabel(values.individual_price_cents)}
            </dd>
          </div>
        </dl>
        {values.discount_note.trim() && (
          <p className="px-4 pb-4 text-xs leading-5 whitespace-pre-wrap wrap-anywhere text-ink-600">
            {values.discount_note.trim()}
          </p>
        )}
      </article>
      <p className="mt-3 text-xs leading-5 text-ink-600">
        Vista previa en vivo. Los cambios se aplican al guardar; los borradores
        no se muestran al público.
      </p>
    </section>
  )
}
