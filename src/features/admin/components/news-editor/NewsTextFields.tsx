import { useId } from 'react'
import { AlignLeft } from 'lucide-react'
import type { NewsEditorErrors, NewsEditorValues } from '../../news-editor'
import { inputClass } from '../ui'

export function NewsTextFields({
  values,
  errors,
  onChange,
}: {
  values: NewsEditorValues
  errors: NewsEditorErrors
  onChange: (name: 'title' | 'excerpt', value: string) => void
}) {
  const id = useId()
  return (
    <section
      aria-label="Contenido de la noticia"
      className="rounded-2xl border border-navy-900/10 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="mb-6 flex items-center gap-3">
        <span
          aria-hidden="true"
          className="grid size-9 place-items-center rounded-lg bg-mist-50 text-navy-800"
        >
          <AlignLeft size={19} />
        </span>
        <div>
          <h2 className="text-base font-extrabold">Contenido de la noticia</h2>
          <p className="mt-0.5 text-xs text-ink-600">
            Contá la novedad con tus palabras.
          </p>
        </div>
      </div>
      <div className="grid gap-6">
        <div>
          <label
            htmlFor={`${id}-title`}
            className="mb-2 block text-sm font-bold"
          >
            Título{' '}
            <span aria-hidden="true" className="text-river-600">
              *
            </span>
          </label>
          <input
            id={`${id}-title`}
            name="title"
            value={values.title}
            onChange={(event) => onChange('title', event.target.value)}
            maxLength={180}
            required
            placeholder="Escribí un título que cuente la novedad"
            aria-invalid={Boolean(errors.title)}
            aria-describedby={`${id}-title-help${errors.title ? ` ${id}-title-error` : ''}`}
            className={`${inputClass} py-3 text-base font-semibold placeholder:font-normal aria-invalid:border-red-500`}
          />
          <div
            id={`${id}-title-help`}
            className="mt-2 flex justify-between gap-3 text-xs text-ink-600"
          >
            <span>Claro, breve y fácil de entender.</span>
            <span className="shrink-0 tabular-nums">
              {values.title.length}/180
            </span>
          </div>
          {errors.title && (
            <p
              id={`${id}-title-error`}
              className="mt-2 text-xs font-semibold text-red-700"
            >
              {errors.title}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor={`${id}-excerpt`}
            className="mb-2 block text-sm font-bold"
          >
            Texto de la noticia{' '}
            <span aria-hidden="true" className="text-river-600">
              *
            </span>
          </label>
          <textarea
            id={`${id}-excerpt`}
            name="excerpt"
            value={values.excerpt}
            onChange={(event) => onChange('excerpt', event.target.value)}
            maxLength={1200}
            rows={8}
            required
            placeholder="Contá qué pasó, cuándo y por qué es importante para el club…"
            aria-invalid={Boolean(errors.excerpt)}
            aria-describedby={`${id}-excerpt-help${errors.excerpt ? ` ${id}-excerpt-error` : ''}`}
            className={`${inputClass} min-h-48 resize-y leading-7 aria-invalid:border-red-500`}
          />
          <div
            id={`${id}-excerpt-help`}
            className="mt-2 flex justify-between gap-3 text-xs text-ink-600"
          >
            <span>Usá párrafos cortos y revisá las fechas.</span>
            <span className="shrink-0 tabular-nums">
              {values.excerpt.length}/1200
            </span>
          </div>
          {errors.excerpt && (
            <p
              id={`${id}-excerpt-error`}
              className="mt-2 text-xs font-semibold text-red-700"
            >
              {errors.excerpt}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
