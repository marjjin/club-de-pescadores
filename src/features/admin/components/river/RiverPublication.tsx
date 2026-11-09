import { Eye, EyeOff } from 'lucide-react'

const options = [
  {
    value: false,
    label: 'Guardar sin publicar',
    description: 'Conservá el dato únicamente en el panel.',
    icon: EyeOff,
  },
  {
    value: true,
    label: 'Mostrar en el sitio público',
    description: 'Actualizá la franja de altura del río al guardar.',
    icon: Eye,
  },
] as const

export function RiverPublication({
  published,
  wasPublished,
  onChange,
}: {
  published: boolean
  wasPublished: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <section
      aria-label="Opciones de publicación"
      className="min-w-0 rounded-2xl border border-navy-900/10 bg-white p-5 shadow-sm"
    >
      <fieldset className="min-w-0">
        <legend className="mb-4 text-base font-extrabold">
          Visibilidad de la medición
        </legend>
        <div className="grid gap-2.5">
          {options.map(({ value, label, description, icon: Icon }) => (
            <label
              key={label}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${published === value ? 'border-river-600/40 bg-mist-50 ring-1 ring-river-600/10' : 'border-navy-900/10 hover:bg-mist-50/60'}`}
            >
              <input
                type="radio"
                name="river-publication"
                checked={published === value}
                onChange={() => onChange(value)}
                className="mt-1 size-4 shrink-0 accent-river-600"
              />
              <span className="min-w-0">
                <span className="flex items-start gap-2 text-sm font-bold">
                  <Icon
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                  />
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
      <p className="mt-4 text-xs leading-5 text-ink-600">
        {wasPublished && !published
          ? 'Al guardar, la medición actual dejará de verse en la página pública.'
          : 'La opción elegida se aplica al guardar. Después de 24 horas, el sitio señala que la medición es antigua.'}
      </p>
    </section>
  )
}
