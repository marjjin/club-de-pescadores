import { CalendarClock, MapPin } from 'lucide-react'
import type {
  RiverErrors,
  RiverTextField,
  RiverValues,
} from '../../river-editor'
import { RiverField } from './RiverField'

export function RiverFields({
  values,
  errors,
  onChange,
}: {
  values: RiverValues
  errors: RiverErrors
  onChange: (name: RiverTextField, value: string) => void
}) {
  return (
    <section
      aria-label="Datos de la medición"
      className="min-w-0 overflow-hidden rounded-2xl border border-navy-900/10 bg-white shadow-sm"
    >
      <header className="border-b border-navy-900/10 p-5 sm:px-6">
        <h2 className="text-base font-extrabold">Datos de la medición</h2>
        <p className="mt-1 text-xs leading-5 text-ink-600">
          Cargá un dato real y verificá su origen antes de publicarlo.
        </p>
      </header>
      <div className="p-5 sm:p-6">
        <h3 className="mb-5 flex items-center gap-2 text-sm font-extrabold">
          <CalendarClock
            size={18}
            aria-hidden="true"
            className="text-river-600"
          />
          Valor y momento de la medición
        </h3>
        <div className="grid min-w-0 items-start gap-5 sm:grid-cols-2">
          {(['height', 'measured_at'] as const).map((name) => (
            <RiverField
              key={name}
              name={name}
              value={values[name]}
              error={errors[name]}
              onChange={onChange}
            />
          ))}
        </div>
        <div className="mt-6 border-t border-navy-900/10 pt-6">
          <h3 className="mb-5 flex items-center gap-2 text-sm font-extrabold">
            <MapPin size={18} aria-hidden="true" className="text-river-600" />
            Origen del dato
          </h3>
          <div className="grid min-w-0 gap-5">
            {(['station', 'source'] as const).map((name) => (
              <RiverField
                key={name}
                name={name}
                value={values[name]}
                error={errors[name]}
                onChange={onChange}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
