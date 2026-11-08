import { useId } from 'react'
import { CalendarClock, FileText, Send } from 'lucide-react'
import type {
  NewsEditorErrors,
  NewsEditorValues,
  PublicationMode,
} from '../../news-editor'
import { inputClass } from '../ui'

const options: {
  value: PublicationMode
  label: string
  description: string
  icon: typeof FileText
}[] = [
  {
    value: 'draft',
    label: 'Guardar como borrador',
    description: 'Visible únicamente en el panel.',
    icon: FileText,
  },
  {
    value: 'now',
    label: 'Publicar ahora',
    description: 'Se verá en el sitio al guardar.',
    icon: Send,
  },
  {
    value: 'scheduled',
    label: 'Programar publicación',
    description: 'Elegí cuándo aparecerá en el sitio.',
    icon: CalendarClock,
  },
]

export function NewsPublication({
  values,
  errors,
  onModeChange,
  onDateChange,
}: {
  values: NewsEditorValues
  errors: NewsEditorErrors
  onModeChange: (mode: PublicationMode) => void
  onDateChange: (date: string) => void
}) {
  const id = useId()
  return (
    <section
      aria-label="Opciones de publicación"
      className="rounded-2xl border border-navy-900/10 bg-white p-5 shadow-sm"
    >
      <fieldset>
        <legend className="mb-4 text-base font-extrabold">Publicación</legend>
        <div className="grid gap-2.5">
          {options.map(({ value, label, description, icon: Icon }) => (
            <label
              key={value}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${values.publication === value ? 'border-river-600/40 bg-mist-50 ring-1 ring-river-600/10' : 'border-navy-900/10 hover:bg-mist-50/60'}`}
            >
              <input
                name="publication"
                type="radio"
                value={value}
                checked={values.publication === value}
                onChange={() => onModeChange(value)}
                className="mt-1 size-4 shrink-0 accent-river-600"
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-sm font-bold">
                  <Icon size={15} aria-hidden="true" />
                  {label}
                </span>
                <span className="mt-1 block text-xs leading-5 text-ink-600">
                  {description}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {values.publication === 'scheduled' && (
        <div className="mt-5 border-t border-navy-900/10 pt-5">
          <label
            htmlFor={`${id}-date`}
            className="mb-2 block text-sm font-bold"
          >
            Fecha y hora de publicación
          </label>
          <input
            id={`${id}-date`}
            name="published_at"
            type="datetime-local"
            value={values.published_at}
            onChange={(event) => onDateChange(event.target.value)}
            required
            className={`${inputClass} aria-invalid:border-red-500`}
            aria-invalid={Boolean(errors.published_at)}
            aria-describedby={`${id}-date-help${errors.published_at ? ` ${id}-date-error` : ''}`}
          />
          <p
            id={`${id}-date-help`}
            className="mt-2 text-xs leading-5 text-ink-600"
          >
            Hora de Argentina (UTC−3). La fecha debe ser futura.
          </p>
          {errors.published_at && (
            <p
              id={`${id}-date-error`}
              className="mt-2 text-xs font-semibold text-red-700"
            >
              {errors.published_at}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
