import { FileText, Send } from 'lucide-react'

const options = [
  {
    value: false,
    label: 'Guardar como borrador',
    description: 'Visible únicamente en el panel.',
    icon: FileText,
  },
  {
    value: true,
    label: 'Publicar en el sitio',
    description: 'Aparecerá en la agenda pública al guardar.',
    icon: Send,
  },
] as const

export function EventPublication({
  published,
  onChange,
}: {
  published: boolean
  onChange: (published: boolean) => void
}) {
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
              key={label}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${published === value ? 'border-river-600/40 bg-mist-50 ring-1 ring-river-600/10' : 'border-navy-900/10 hover:bg-mist-50/60'}`}
            >
              <input
                name="publication"
                type="radio"
                checked={published === value}
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
    </section>
  )
}
