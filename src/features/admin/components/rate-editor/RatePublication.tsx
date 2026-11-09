import { CalendarClock, FileText, Send } from 'lucide-react'
import { rateVisibility } from '../../rate-editor'
import type { RateEditorValues } from '../../rate-editor'

export function RatePublication({
  values,
  onChange,
}: {
  values: RateEditorValues
  onChange: (published: boolean) => void
}) {
  const visibility = rateVisibility(values)
  return (
    <section
      aria-label="Opciones de publicación"
      className="min-w-0 rounded-2xl border border-navy-900/10 bg-white p-5 shadow-sm"
    >
      <fieldset className="min-w-0">
        <legend className="mb-4 text-base font-extrabold">Publicación</legend>
        <div className="grid gap-2.5">
          {[
            {
              value: false,
              label: 'Guardar como borrador',
              description: 'Visible únicamente en el panel.',
              icon: FileText,
            },
            {
              value: true,
              label: 'Publicar en el sitio',
              description: 'Visible al público durante la vigencia elegida.',
              icon: Send,
            },
          ].map(({ value, label, description, icon: Icon }) => (
            <label
              key={label}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${values.is_published === value ? 'border-river-600/40 bg-mist-50 ring-1 ring-river-600/10' : 'border-navy-900/10 hover:bg-mist-50/60'}`}
            >
              <input
                name="publication"
                type="radio"
                checked={values.is_published === value}
                onChange={() => onChange(value)}
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
      <div
        className="mt-4 border-t border-navy-900/10 pt-4 text-xs leading-5"
        role="status"
      >
        <p className="flex items-center gap-2 font-bold">
          <CalendarClock size={15} aria-hidden="true" />
          {visibility.label}
        </p>
        <p className="mt-1 text-ink-600">{visibility.description}</p>
      </div>
    </section>
  )
}
