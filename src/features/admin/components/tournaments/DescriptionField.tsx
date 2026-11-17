import { useId } from 'react'
import { inputClass } from '../ui'

const MAX = 2000

export function DescriptionField({
  value,
  error,
  onChange,
}: {
  value: string
  error?: string | undefined
  onChange: (value: string) => void
}) {
  const id = useId()
  const left = MAX - value.length
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-sm font-bold text-navy-900">
        Descripción (opcional)
      </label>
      <textarea
        id={id}
        name="description"
        value={value}
        maxLength={MAX}
        rows={6}
        placeholder={
          'Por ejemplo: modalidad, inscripción por categoría, premios, qué incluye y cómo anotarse.'
        }
        aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-help`}
        onChange={(event) => onChange(event.target.value)}
        className={`${inputClass} min-h-36 resize-y leading-6`}
      />
      <p
        id={`${id}-help`}
        className={`flex flex-wrap justify-between gap-2 text-xs ${error ? 'text-red-700' : 'text-ink-600'}`}
      >
        <span>
          {error ??
            'Se muestra en la página del torneo, respetando los saltos de línea. En la agenda aparece el comienzo.'}
        </span>
        <span className="tabular-nums">
          {left} {left === 1 ? 'carácter disponible' : 'caracteres disponibles'}
        </span>
      </p>
    </div>
  )
}
